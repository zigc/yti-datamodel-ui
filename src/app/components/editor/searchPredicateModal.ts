import { IPromise, IScope } from 'angular';
import { IModalService, IModalServiceInstance } from 'angular-ui-bootstrap';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { PredicateService } from 'app/services/predicateService';
import { EntityCreation, SearchConceptModal } from './searchConceptModal';
import { LanguageService, Localizer } from 'app/services/languageService';
import { EditableForm } from 'app/components/form/editableEntityController';
import { AddNew } from 'app/components/common/searchResults';
import { glyphIconClassForType } from 'app/utils/entity';
import { ChoosePredicateTypeModal } from './choosePredicateTypeModal';
import { ClassService } from 'app/services/classService';
import { collectProperties } from 'yti-common-ui/utils/array';
import { combineExclusions, createDefinedByExclusion, createExistsExclusion, Exclusion } from 'app/utils/exclusion';
import { SearchController, SearchFilter } from 'app/types/filter';
import { AbstractPredicate, Predicate, PredicateListItem } from 'app/entities/predicate';
import { Model } from 'app/entities/model';
import { KnownPredicateType } from 'app/types/entity';
import { ExternalEntity } from 'app/entities/externalEntity';
import { Class, Property } from 'app/entities/class';
import { defaultLabelComparator, filterAndSortSearchResults } from 'app/components/filter/util';
import { ignoreModalClose } from 'yti-common-ui/utils/modal';
import { requireDefined } from 'yti-common-ui/utils/object';
import { DataSource } from '../form/dataSource';

const noExclude = (_item: PredicateListItem) => null;

export class SearchPredicateModal {

  constructor(private $uibModal: IModalService,
              private choosePredicateTypeModal: ChoosePredicateTypeModal,
              private classService: ClassService) {
    'ngInject';
  }

  openAddPredicate(model: Model, type: KnownPredicateType, exclude: Exclusion<AbstractPredicate> = noExclude): IPromise<ExternalEntity | EntityCreation | Predicate> {
    return this.openModal(model, type, undefined, exclude, false, false);
  }

  openAddProperty(model: Model, klass: Class): IPromise<Property> {

    const exclude = combineExclusions<PredicateListItem>(
      createExistsExclusion(collectProperties(klass.properties.filter(p => p.isAttribute()), p => p.predicateId.uri)),
      createDefinedByExclusion(model)
    );

    return this.openModal(model, null, undefined, exclude, false, true).then(predicate => {
      if (predicate instanceof Predicate && predicate.normalizedType === 'property') {
        return this.choosePredicateTypeModal.open().then(type => {
          return this.classService.newProperty(predicate, type, model);
        });
      } else {
        return this.classService.newProperty(predicate, predicate.normalizedType as KnownPredicateType, model);
      }
    });
  }

  openWithCustomDataSource(model: Model, type: KnownPredicateType, dataSource: DataSource<PredicateListItem>, exclude: Exclusion<AbstractPredicate> = noExclude): IPromise<Predicate> {
    return this.openModal(model, type, dataSource, exclude, true, false);
  }

  openWithOnlySelection(model: Model, type: KnownPredicateType, exclude: Exclusion<AbstractPredicate> = noExclude): IPromise<Predicate> {
    return this.openModal(model, type, undefined, exclude, true, true);
  }

  private openModal(model: Model, type: KnownPredicateType | null, customDataSource: DataSource<PredicateListItem> | undefined, exclude: Exclusion<AbstractPredicate>, onlySelection: boolean, allowExternal: boolean) {
    return this.$uibModal.open({
      template: require('./searchPredicateModal.html'),
      size: 'lg',
      controller: SearchPredicateController,
      controllerAs: '$ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        type: () => type,
        exclude: () => exclude,
        onlySelection: () => onlySelection,
        allowExternal: () => allowExternal,
        customDataSource: () => customDataSource
      }
    }).result;
  }
}

export interface SearchPredicateScope extends IScope {
  form: EditableForm;
}

export class SearchPredicateController implements SearchController<PredicateListItem> {

  searchResults: (PredicateListItem | AddNewPredicate)[] = [];
  selection: Predicate | ExternalEntity;
  searchText = '';
  typeSelectable: boolean;
  excludeError: string | null = null;
  cannotConfirm: string | null = null;
  loadingResults: boolean;
  selectedItem: PredicateListItem | AddNewPredicate;
  // undefined means not fetched, null means does not exist
  externalPredicate: Predicate | null | undefined;
  contentMatchers = [
    { name: 'Label', extractor: (predicate: PredicateListItem) => predicate.label },
    { name: 'Description', extractor: (predicate: PredicateListItem) => predicate.comment },
    { name: 'Identifier', extractor: (predicate: PredicateListItem) => predicate.id.compact }
  ];
  contentExtractors = this.contentMatchers.map(m => m.extractor);
  private predicates: PredicateListItem[] = [];
  private localizer: Localizer;
  private searchFilters: SearchFilter<PredicateListItem>[] = [];

  constructor(private $scope: SearchPredicateScope,
              private $uibModalInstance: IModalServiceInstance,
              public model: Model,
              public type: KnownPredicateType | null,
              public customDataSource: DataSource<PredicateListItem> | undefined,
              public exclude: Exclusion<PredicateListItem>,
              public onlySelection: boolean,
              public allowExternal: boolean,
              private predicateService: PredicateService,
              languageService: LanguageService,
              private searchConceptModal: SearchConceptModal,
              private gettextCatalog: GettextCatalog) {
    'ngInject';
    this.localizer = languageService.createLocalizer(model);
    this.loadingResults = true;
    this.typeSelectable = !type;

    const appendResults = (predicates: PredicateListItem[]) => {
      this.predicates = this.predicates.concat(predicates);
      this.search();
      this.loadingResults = false;
    };

    if (!customDataSource) {
      predicateService.getAllPredicates(model).then(appendResults);
      if (this.canAddExternal()) {
        predicateService.getExternalPredicatesForModel(model).then(appendResults);
      }
    } else {
      customDataSource('').then(appendResults);
    }

    $scope.$watch(() => this.selection && this.selection.id, selectionId => {
      if (selectionId && this.selection instanceof ExternalEntity) {
        this.externalPredicate = undefined;
        predicateService.getExternalPredicate(selectionId, model).then(predicate => this.externalPredicate = predicate);
      }
    });
  }

  get items() {
    return this.predicates;
  }

  editInProgress = () => this.$scope.form.editing && this.$scope.form.$dirty;

  addFilter(filter: SearchFilter<PredicateListItem>) {
    this.searchFilters.push(filter);
  }

  canAddExternal() {
    return this.model.isOfType('profile') && this.allowExternal;
  }

  isSelectionExternalEntity(): boolean {
    return this.selection instanceof ExternalEntity;
  }

  isSelectionPredicate(): boolean {
    return this.selection instanceof Predicate;
  }

  search() {
    this.searchResults = [
      new AddNewPredicate(
        `${this.gettextCatalog.getString('Create new attribute')} '${this.searchText}'`,
        this.isAttributeAddable.bind(this),
        'attribute',
        false
      ),
      new AddNewPredicate(
        `${this.gettextCatalog.getString('Create new association')} '${this.searchText}'`,
        this.isAssociationAddable.bind(this),
        'association',
        false
      ),
      new AddNewPredicate(
        `${this.gettextCatalog.getString('Create new predicate')} ${this.gettextCatalog.getString('by referencing external uri')}`,
        () => this.canAddExternal(),
        this.type,
        true
      ),
      ...filterAndSortSearchResults(this.predicates, this.searchText, this.contentExtractors, this.searchFilters, defaultLabelComparator(this.localizer, this.exclude))
    ];
  }

  selectItem(item: AbstractPredicate | AddNewPredicate) {
    this.selectedItem = item;
    this.externalPredicate = undefined;
    this.excludeError = null;
    this.$scope.form.editing = false;
    this.$scope.form.$setPristine();

    if (item instanceof AddNewPredicate) {
      if (item.external) {
        this.$scope.form.editing = true;
        this.selection = new ExternalEntity(this.localizer.language, this.searchText, this.type || 'attribute');
      } else {
        this.createNew(item.type!);
      }
    } else {
      this.cannotConfirm = this.exclude(item);

      if (this.model.isNamespaceKnownToBeNotModel(item.definedBy.id.toString())) {
        this.predicateService.getExternalPredicate(item.id, this.model).then(result => {
          this.selection = requireDefined(result); // TODO check if result can actually be null
        });
      } else {
        this.predicateService.getPredicate(item.id, this.model).then(result => this.selection = result);
      }
    }
  }

  loadingSelection(item: PredicateListItem | AddNew) {
    const selection = this.selection;
    if (item instanceof PredicateListItem) {
      return item === this.selectedItem && (!selection || (selection instanceof Predicate && !item.id.equals(selection.id)));
    } else {
      return false;
    }
  }

  isExternalPredicatePending() {
    return this.isSelectionExternalEntity() && this.externalPredicate === undefined;
  }

  confirm() {
    const selection = this.selection;

    if (selection instanceof Predicate) {
      if (selection.unsaved) {
        this.predicateService.createPredicate(selection)
          .then(() => this.$uibModalInstance.close(selection), err => this.excludeError = err.data.errorMessage);
      } else {
        this.$uibModalInstance.close(selection);
      }
    } else if (selection instanceof ExternalEntity) {
      if (this.externalPredicate) {
        const exclude = this.exclude(this.externalPredicate);
        if (exclude) {
          this.excludeError = exclude;
        } else {
          this.$uibModalInstance.close(this.externalPredicate);
        }
      } else {
        this.$uibModalInstance.close(selection);
      }
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
    return !!this.searchText && !this.onlySelection && (this.typeSelectable || this.type === 'attribute');
  }

  isAssociationAddable(): boolean {
    return !!this.searchText && !this.onlySelection && (this.typeSelectable || this.type === 'association');
  }
}

class AddNewPredicate extends AddNew {
  constructor(public label: string, public show: () => boolean, public type: KnownPredicateType | null, public external: boolean) {
    super(label, show, glyphIconClassForType(type ? [type] : []));
  }
}
