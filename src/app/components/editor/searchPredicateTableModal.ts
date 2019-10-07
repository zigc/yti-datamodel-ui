import { IPromise, IScope } from 'angular';
import { IModalService, IModalServiceInstance } from 'angular-ui-bootstrap';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { PredicateService, RelatedPredicate } from '../../services/predicateService';
import { SearchConceptModal, EntityCreation } from './searchConceptModal';
import { LanguageService, Localizer } from '../../services/languageService';
import { EditableForm } from '../../components/form/editableEntityController';
import { infoDomainMatches } from '../../utils/entity';
import { contains } from 'yti-common-ui/utils/array';
import { Exclusion, combineExclusions, createExistsExclusion, createDefinedByExclusion } from '../../utils/exclusion';
import { SearchFilter, SearchController } from '../../types/filter';
import { PredicateListItem, AbstractPredicate, Predicate } from '../../entities/predicate';
import { Model } from '../../entities/model';
import { KnownPredicateType, DefinedByType, SortBy } from '../../types/entity';
import { filterAndSortSearchResults, defaultLabelComparator } from '../../components/filter/util';
import { ignoreModalClose } from 'yti-common-ui/utils/modal';
import { Value, DisplayItemFactory } from '../form/displayItemFactory';
import { ifChanged, modalCancelHandler } from '../../utils/angular';
import { Classification } from '../../entities/classification';
import { comparingLocalizable } from '../../utils/comparator';
import { ClassificationService } from '../../services/classificationService';
import { ModelService } from '../../services/modelService';
import { Status, selectableStatuses } from 'yti-common-ui/entities/status';
import { Language } from '../../types/language';
import { ShowPredicateInfoModal } from './showPredicateInfoModal';

export const noPredicateExclude = (_item: PredicateListItem) => null;

export class SearchPredicateTableModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  private openModal(model: Model,
                    type: KnownPredicateType | null,
                    exclude: Exclusion<AbstractPredicate>,
                    filterExclude: Exclusion<AbstractPredicate>,
                    predicatesAssignedToModel: Set<string>) {
    return this.$uibModal.open({
      template: require('./searchPredicateTableModal.html'),
      size: 'xl',
      windowClass: 'modal-full-height',
      controller: SearchPredicateTableController,
      controllerAs: '$ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        type: () => type,
        exclude: () => exclude,
        filterExclude: () => filterExclude,
        predicatesAssignedToModel: () => predicatesAssignedToModel
      }
    }).result;
  }

  openAddPredicate(model: Model,
                   type: KnownPredicateType,
                   exclude: Exclusion<AbstractPredicate> = noPredicateExclude,
                   filterExclude: Exclusion<AbstractPredicate> = exclude,
                   predicatesAssignedToModel: Set<string>): IPromise<EntityCreation | Predicate> {
    return this.openModal(model, type, exclude, filterExclude, predicatesAssignedToModel);
  }
}

export interface SearchPredicateTableScope extends IScope {
  form: EditableForm;
}

class SearchPredicateTableController implements SearchController<PredicateListItem> {
  private predicates: PredicateListItem[] = [];

  searchResults: (PredicateListItem)[] = [];
  selection: Predicate | null;
  searchText = '';
  typeSelectable: boolean;
  cannotConfirm: string | null = null;
  loadingResults: boolean;
  selectedItem: PredicateListItem | null;
  showInfoDomain: Classification | null;
  infoDomains: Classification[];
  showStatus: Status|null;
  modelTypes: DefinedByType[];
  showModelType: DefinedByType | null;

  sortBy: SortBy<PredicateListItem>;

  private localizer: Localizer;

  contentMatchers = [
    { name: 'Label', extractor: (predicate: PredicateListItem) => predicate.label },
    { name: 'Description', extractor: (predicate: PredicateListItem) => predicate.comment },
    { name: 'Identifier', extractor: (predicate: PredicateListItem) => predicate.id.compact }
  ];

  contentExtractors = this.contentMatchers.map(m => m.extractor);

  private searchFilters: SearchFilter<PredicateListItem>[] = [];

  constructor(private $scope: SearchPredicateTableScope,
              private $uibModalInstance: IModalServiceInstance,
              public model: Model,
              public type: KnownPredicateType | null,
              public exclude: Exclusion<PredicateListItem>,
              public filterExclude: Exclusion<PredicateListItem>,
              public predicatesAssignedToModel: Set<string>,
              private predicateService: PredicateService,
              languageService: LanguageService,
              private searchConceptModal: SearchConceptModal,
              private gettextCatalog: GettextCatalog,
              private displayItemFactory: DisplayItemFactory,
              classificationService: ClassificationService,
              protected showPredicateInfoModal: ShowPredicateInfoModal,
              private modelService: ModelService) {
    'ngInject';
    this.localizer = languageService.createLocalizer(model);
    this.loadingResults = true;
    this.typeSelectable = !type;

    this.modelTypes = ['library', 'profile'];

    this.sortBy = {
      name: 'name',
      comparator: defaultLabelComparator(this.localizer, this.filterExclude),
      descOrder: false
    };

    const sortInfoDomains = () => {
      this.infoDomains.sort(comparingLocalizable<Classification>(this.localizer, infoDomain => infoDomain.label));
    }

    classificationService.getClassifications().then(infoDomains => {

      modelService.getModels().then(models => {

        const modelCount = (infoDomain: Classification) =>
          models.filter(mod => infoDomainMatches(infoDomain, mod)).length;

        this.infoDomains = infoDomains.filter(infoDomain => modelCount(infoDomain) > 0);
        sortInfoDomains();
      });
    });

    const appendResults = (predicates: PredicateListItem[]) => {
      this.predicates = this.predicates.concat(predicates);
      this.search();
      this.loadingResults = false;
    };

    predicateService.getAllPredicates(model).then(appendResults);

    this.addFilter(predicateListItem =>
      !this.showInfoDomain || contains(predicateListItem.item.definedBy.classifications.map(classification => classification.identifier), this.showInfoDomain.identifier)
    );

    this.addFilter(predicateListItem =>
      !this.showStatus || predicateListItem.item.status === this.showStatus
    );

    this.addFilter(predicateListItem =>
      !this.showModelType || predicateListItem.item.definedBy.normalizedType === this.showModelType
    );

    $scope.$watch(() => this.showInfoDomain, ifChanged<Classification|null>(() => this.search()));
    $scope.$watch(() => this.showModelType, ifChanged<DefinedByType|null>(() => this.search()));
    $scope.$watch(() => this.showStatus, ifChanged<Status|null>(() => this.search()));
    $scope.$watch(() => this.sortBy.name, ifChanged<string>(() => this.search()));
    $scope.$watch(() => this.sortBy.descOrder, ifChanged<Boolean>(() => this.search()));
    $scope.$watch(() => languageService.getModelLanguage(model), ifChanged<Language>(() => {
      sortInfoDomains();
      this.search();
    }));

  }

  addFilter(filter: SearchFilter<PredicateListItem>) {
    this.searchFilters.push(filter);
  }

  get items() {
    return this.predicates;
  }

  get statuses() {
    return selectableStatuses;
  }

  isSelectionPredicate(): boolean {
    return this.selection instanceof Predicate;
  }

  search() {
    this.removeSelection();

    this.searchResults = [
      ...filterAndSortSearchResults(this.predicates, this.searchText, this.contentExtractors, this.searchFilters, this.sortBy.comparator, 0)
    ];
  }

  selectItem(item: AbstractPredicate) {
    this.selectedItem = item;
    this.$scope.form.editing = false;
    this.$scope.form.$setPristine();

    this.cannotConfirm = this.exclude(item);

    this.predicateService.getPredicate(item.id, this.model).then(result => this.selection = result);
  }

  removeSelection() {
    this.selection = null;
    this.selectedItem = null;
  }

  isSelected(item: AbstractPredicate) {
    return this.selectedItem === item;
  }

  loadingSelection(item: PredicateListItem) {
    const selection = this.selection;
    if (item instanceof PredicateListItem) {
      return item === this.selectedItem && (!selection || (selection instanceof Predicate && !item.id.equals(selection.id)));
    } else {
      return false;
    }
  }

  confirm() {
    const selection = this.selection;

    if (selection instanceof Predicate) {
      this.$uibModalInstance.close(selection);
    } else {
      throw new Error('Unsupported selection: ' + selection);
    }
  }

  close() {
    this.$uibModalInstance.dismiss('cancel');
  }

  createNew(type: KnownPredicateType) {
    return this.searchConceptModal.openNewEntityCreation(this.model.vocabularies, this.model, type, this.searchText)
      .then(result => {
        if (!this.typeSelectable) {
          this.$uibModalInstance.close(result);
        } else {
          this.predicateService.newPredicate(this.model, result.entity.label, result.conceptId, type, this.localizer.language)
            .then(predicate => {
              this.cannotConfirm = null;
              this.selection = predicate;
              this.$scope.form.editing = true;
            });
        }
      }, ignoreModalClose);
  }

  isEditing(): boolean {
    return this.$scope.form && this.$scope.form.editing;
  }

  isAttributeAddable(): boolean {
    return !!this.searchText && (this.typeSelectable || this.type === 'attribute');
  }

  isAssociationAddable(): boolean {
    return !!this.searchText && (this.typeSelectable || this.type === 'association');
  }

  canAddNew(): boolean {
    return this.isAttributeAddable() || this.isAssociationAddable();
  }

  showItemValue(value: Value) {
    return this.displayItemFactory.create({
      context: () => this.model,
      value: () => value
    }).displayValue;
  }

  generateSearchResultID(item: AbstractPredicate): string {
    return `${item.id.toString()}${'_search_predicate_link'}`;
  }

  showPredicateInfo() {
    return this.showPredicateInfoModal.open(this.model, this.selection!).then(null, modalCancelHandler);
  }

  copyPredicate(item: AbstractPredicate) {
    this.$uibModalInstance.close(new RelatedPredicate(item.id, 'prov:wasDerivedFrom'));
  }

  createSubPredicate(item: AbstractPredicate) {
    this.$uibModalInstance.close(new RelatedPredicate(item.id, 'rdfs:subPropertyOf'));
  }

  createSuperPredicate(item: AbstractPredicate) {
    this.$uibModalInstance.close(new RelatedPredicate(item.id, 'iow:superPropertyOf'));
  }

  itemTitle(item: AbstractPredicate) {

    const disabledReason = this.exclude(item);

    if (!!disabledReason) {
      return this.gettextCatalog.getString(disabledReason);
    } else {
      return null;
    }
  }

  addNamespaceToModel(item: AbstractPredicate) {

    this.modelService.newModelRequirement(this.model, item.id.uri).then(response => {

      this.modelService.getModelByPrefix(this.model.prefix).then(model => {
        this.model.importedNamespaces = model.importedNamespaces;
        this.model.context = model.context;

        this.exclude = combineExclusions<AbstractPredicate>(
          createExistsExclusion(this.predicatesAssignedToModel),
          createDefinedByExclusion(this.model));

        this.cannotConfirm = this.exclude(item);
        this.selectItem(item);
      });
    });
  }
}
