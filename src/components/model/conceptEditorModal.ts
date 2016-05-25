import IScope = angular.IScope;
import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { ConceptService } from '../../services/conceptService';
import { LanguageService } from '../../services/languageService';
import { Model, Concept, DefinedBy, ConceptSuggestion, Localizable, Reference } from '../../services/entities';
import { comparingLocalizable } from '../../services/comparators';
import { ConfirmationModal } from '../common/confirmationModal';
import { ConceptViewController } from './conceptView';
import { Uri } from '../../services/uri';

export class ConceptEditorModal {

  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(model: Model) {
    return this.$uibModal.open({
      template: require('./conceptEditorModal.html'),
      size: 'large',
      controller: ConceptEditorModalController,
      controllerAs: 'ctrl',
      backdrop: false,
      resolve: {
        model: () => model
      }
    }).result;
  }
};

export class ConceptEditorModalController {

  concepts: Concept[] = [];
  searchResults: Concept[] = [];
  selection: Concept;

  models: DefinedBy[] = [];
  showModel: DefinedBy;
  searchText: string = '';

  loadingResults: boolean;
  editInProgress = () => this.view.isEditing();

  view: ConceptViewController;

  /* @ngInject */
  constructor(private $scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              private languageService: LanguageService,
              private conceptService: ConceptService,
              private confirmationModal: ConfirmationModal,
              private model: Model) {

    this.loadingResults = true;

    conceptService.getConceptsForModel(model)
      .then(concepts => {
        this.concepts = concepts;
        this.models = _.chain(concepts)
          .filter(concept => concept instanceof ConceptSuggestion && !!concept.definedBy)
          .map((concept: ConceptSuggestion) => concept.definedBy)
          .uniq(definedBy => definedBy.id.uri)
          .value();

        this.sort();
        this.search();
        this.loadingResults = false;
      });

    $scope.$watch(() => this.languageService.getModelLanguage(this.model), lang => this.sort());
    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showModel, () => this.search());

    $scope.$on('modal.closing', event => {
      if (this.editInProgress()) {
        event.preventDefault();
        this.confirmationModal.openEditInProgress().then(() => {
          this.view.cancelEditing();
          this.$uibModalInstance.close();
        });
      }
    });
  }

  sort() {
    const language = this.languageService.getModelLanguage(this.model);
    const labelComparator = comparingLocalizable<{label: Localizable}>(language, definedBy => definedBy.label);
    this.concepts.sort(labelComparator);
    this.models.sort(labelComparator);
  }

  selectionEdited(concept: Concept) {
    for (let i = 0; i < this.concepts.length; i++) {
      if (this.concepts[i].id.equals(concept.id)) {
        Object.assign(this.concepts[i], concept);
        break;
      }
    }
  }

  registerView(view: ConceptViewController) {
    this.view = view;
  }

  search() {
    this.searchResults = this.concepts.filter(concept =>
      this.textFilter(concept) &&
      this.modelFilter(concept)
    );
  }

  private textFilter(concept: Concept): boolean {
    return !this.searchText || this.localizedLabelAsLower(concept).includes(this.searchText.toLowerCase());
  }

  private modelFilter(concept: Concept): boolean {
    return !this.showModel || concept instanceof ConceptSuggestion && concept.definedBy.id.equals(this.showModel.id);
  }

  private localizedLabelAsLower(concept: Concept): string {
    return this.languageService.translate(concept.label, this.model).toLowerCase();
  }

  selectItem(item: Concept) {
    this.view.cancelEditing();
    this.selection = item;
  }

  nameForScheme(scheme: Reference|Uri) {
    if (scheme instanceof Uri) {
      return scheme.uri;
    } else if (scheme instanceof Reference) {
      return this.languageService.translate(scheme.label, this.model);
    } else {
      throw new Error('Unknown scheme type: ' + scheme);
    }
  }

  close() {
    this.$uibModalInstance.close();
  }
}