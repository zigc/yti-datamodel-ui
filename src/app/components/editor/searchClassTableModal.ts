import { IPromise, IScope } from 'angular';
import { IModalService, IModalServiceInstance } from 'angular-ui-bootstrap';
import { SearchConceptModal, EntityCreation } from './searchConceptModal';
import { ClassService, RelatedClass } from '../../services/classService';
import { LanguageService, Localizer } from '../../services/languageService';
import { EditableForm } from '../../components/form/editableEntityController';
import { Exclusion } from '../../utils/exclusion';
import { SearchFilter, SearchController } from '../../types/filter';
import { AbstractClass, Class, ClassListItem } from '../../entities/class';
import { Model } from '../../entities/model';
import { ExternalEntity } from '../../entities/externalEntity';
import { filterAndSortSearchResults, defaultLabelComparator } from '../../components/filter/util';
import { Optional, requireDefined } from 'yti-common-ui/utils/object';
import { ignoreModalClose } from 'yti-common-ui/utils/modal';
import { DisplayItemFactory, Value } from '../form/displayItemFactory';
import { Status, selectableStatuses } from 'yti-common-ui/entities/status';
import { ifChanged, modalCancelHandler } from '../../utils/angular';
import { Classification } from '../../entities/classification';
import { ClassificationService } from '../../services/classificationService';
import { contains } from 'yti-common-ui/utils/array';
import { ModelService } from '../../services/modelService';
import { comparingLocalizable } from '../../utils/comparator';
import { Language } from '../../types/language';
import { DefinedByType, SortBy } from '../../types/entity';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { infoDomainMatches } from '../../utils/entity';
import { ShowClassInfoModal } from './showClassInfoModal';

export const noExclude = (_item: AbstractClass) => null;
export const defaultTextForSelection = (_klass: Class) => 'Use class';

export class SearchClassTableModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  private openModal(model: Model,
                    exclude: Exclusion<AbstractClass>,
                    filterExclude: Exclusion<AbstractClass>,
                    defaultToCurrentModel: boolean,
                    onlySelection: boolean,
                    textForSelection: (klass: Optional<Class>) => string) {

    return this.$uibModal.open({
      template: require('./searchClassTableModal.html'),
      size: 'xl',
      controller: SearchClassTableController,
      controllerAs: '$ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        exclude: () => exclude,
        filterExclude: () => filterExclude,
        defaultToCurrentModel: () => defaultToCurrentModel,
        onlySelection: () => onlySelection,
        textForSelection: () => textForSelection
      }
    }).result;
  }

  open(model: Model,
       exclude: Exclusion<AbstractClass>,
       filterExclude: Exclusion<AbstractClass> = exclude,
       textForSelection: (klass: Optional<Class>) => string): IPromise<ExternalEntity|EntityCreation|Class> {

    return this.openModal(model, exclude, filterExclude, false, false, textForSelection);
  }

  openWithOnlySelection(model: Model,
                        defaultToCurrentModel: boolean,
                        exclude: Exclusion<AbstractClass>,
                        filterExclude: Exclusion<AbstractClass> = exclude,
                        textForSelection: (klass: Optional<Class>) => string = defaultTextForSelection): IPromise<Class> {

    return this.openModal(model, exclude, filterExclude, defaultToCurrentModel, true, textForSelection);
  }
}

export interface SearchClassTableScope extends IScope {
  form: EditableForm;
}

class SearchClassTableController implements SearchController<ClassListItem> {

  private classes: ClassListItem[] = [];
  private internalClasses: ClassListItem[] = [];
  private externalClasses: ClassListItem[] = [];

  searchResults: (ClassListItem)[] = [];
  selection: Class|ExternalEntity|null;
  searchText = '';
  cannotConfirm: string|null;
  loadingResults: boolean;
  selectedItem: ClassListItem|null;
  showStatus: Status|null;
  showInfoDomain: Classification|null;
  infoDomains: Classification[];
  modelTypes: DefinedByType[];
  showModelType: DefinedByType|null;
  showProfiles = false;
  showOnlyExternalClasses = false;

  // undefined means not fetched, null means does not exist
  externalClass: Class|null|undefined;

  sortBy: SortBy<ClassListItem>;

  private localizer: Localizer;

  contentMatchers = [
    { name: 'Label', extractor: (klass: ClassListItem) => klass.label },
    { name: 'Description', extractor: (klass: ClassListItem) => klass.comment },
    { name: 'Identifier', extractor: (klass: ClassListItem) => klass.id.compact }
  ];

  contentExtractors = this.contentMatchers.map(m => m.extractor);

  searchFilters: SearchFilter<ClassListItem>[] = [];

  constructor(private $scope: SearchClassTableScope,
              private $uibModalInstance: IModalServiceInstance,
              private classService: ClassService,
              languageService: LanguageService,
              public model: Model,
              public exclude: Exclusion<AbstractClass>,
              public filterExclude: Exclusion<AbstractClass>,
              public defaultToCurrentModel: boolean,
              public onlySelection: boolean,
              public textForSelection: (klass: Optional<Class>) => string,
              private searchConceptModal: SearchConceptModal,
              private displayItemFactory: DisplayItemFactory,
              private gettextCatalog: GettextCatalog,
              classificationService: ClassificationService,
              protected showClassInfoModal: ShowClassInfoModal,
              modelService: ModelService) {
    'ngInject';
    this.localizer = languageService.createLocalizer(model);
    this.loadingResults = true;

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

    const results = (classes: ClassListItem[]) => {
      this.internalClasses = classes;
      this.search();
      this.loadingResults = false;
    };

    const externalResults = (classes: ClassListItem[]) => {
      this.externalClasses = classes;
      this.search();
      this.loadingResults = false;
    };


    classService.getAllClasses(model).then(results);

    if (model.isOfType('profile')) {
      classService.getExternalClassesForModel(model).then(externalResults);
    }

    $scope.$watch(() => this.selection && this.selection.id, selectionId => {
      if (selectionId && this.selection instanceof ExternalEntity) {
        this.externalClass = undefined;
        classService.getExternalClass(selectionId, model).then(klass => this.externalClass = klass);
      }
    });

    this.addFilter(classListItem =>
      !this.showStatus || classListItem.item.status === this.showStatus
    );

    this.addFilter(classListItem =>
      !this.showInfoDomain || contains(classListItem.item.definedBy.classifications.map(classification => classification.identifier), this.showInfoDomain.identifier)
    );

    this.addFilter(classListItem =>
      !this.showModelType || classListItem.item.definedBy.normalizedType === this.showModelType
    );

    this.addFilter(classListItem =>
      this.showProfiles || !classListItem.item.definedBy.isOfType('profile')
  );

    $scope.$watch(() => this.showStatus, ifChanged<Status|null>(() => this.search()));
    $scope.$watch(() => this.showModelType, ifChanged<DefinedByType|null>(() => this.search()));
    $scope.$watch(() => this.showInfoDomain, ifChanged<Classification|null>(() => this.search()));
    $scope.$watch(() => this.sortBy.name, ifChanged<string>(() => this.search()));
    $scope.$watch(() => this.sortBy.descOrder, ifChanged<Boolean>(() => this.search()));
    $scope.$watch(() => languageService.getModelLanguage(model), ifChanged<Language>(() => {
      sortInfoDomains();
      this.search();
    }));
    $scope.$watch(() => this.showOnlyExternalClasses, ifChanged<Boolean>(() => {
      if (this.showOnlyExternalClasses) {
        if (this.showProfiles) {
          this.showProfiles = false;
        }
        this.showInfoDomain = null;
        this.showModelType = null;
        this.showStatus = null;
      }
      this.search();
    }));
    this.$scope.$watch(() => this.showProfiles, ifChanged<Boolean>(() => {
      if (this.showProfiles && this.showOnlyExternalClasses) {
        this.showOnlyExternalClasses = false;
      }
      this.search();
    }));
  }

  get items() {
    return this.classes;
  }

  addFilter(searchFilter: SearchFilter<ClassListItem>) {
    this.searchFilters.push(searchFilter);
  }

  get statuses() {
    return selectableStatuses;
  }

  isSelectionExternalEntity(): boolean {
    return this.selection instanceof ExternalEntity;
  }

  search() {
    this.removeSelection();

    if (this.showOnlyExternalClasses) {
      this.classes = this.externalClasses;
    } else {
      this.classes = this.internalClasses;
    }

    this.searchResults = [
       ...filterAndSortSearchResults(this.classes, this.searchText, this.contentExtractors, this.searchFilters, this.sortBy.comparator)
    ];
  }

  canAddNew() {
    return !this.onlySelection && !!this.searchText;
  }

  canAddNewShape() {
    return this.canAddNew() && this.model.isOfType('profile');
  }

  selectItem(item: AbstractClass) {

    this.selectedItem = item;
    this.externalClass = undefined;
    this.$scope.form.editing = false;
    this.$scope.form.$setPristine();

    this.cannotConfirm = this.exclude(item);

    if (this.model.isNamespaceKnownToBeNotModel(item.definedBy.id.toString())) {
      this.classService.getExternalClass(item.id, this.model).then(result => {
        this.selection = requireDefined(result); // TODO check if result can actually be null
        this.cannotConfirm = this.exclude(requireDefined(result));
      });
    } else {
      this.classService.getClass(item.id, this.model).then(result => this.selection = result);
    }
  }

  removeSelection() {
    this.selection = null;
    this.selectedItem = null;
  }

  isSelected(item: AbstractClass) {
    return this.selectedItem === item;
  }

  loadingSelection(item: ClassListItem) {
    const selection = this.selection;
    return item === this.selectedItem && (!selection || (selection instanceof Class && !item.id.equals(selection.id)));
  }

  isExternalClassPending() {
    return this.isSelectionExternalEntity() && this.externalClass === undefined;
  }

  confirm() {
    const selection = this.selection;

    if (selection instanceof Class) {
      this.$uibModalInstance.close(this.selection);
    } else if (selection instanceof ExternalEntity) {
      if (this.externalClass) {
        const exclude = this.exclude(this.externalClass);
        if (exclude) {
          this.cannotConfirm = exclude;
        } else {
          this.$uibModalInstance.close(this.externalClass);
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

  createNewClass() {
    return this.searchConceptModal.openNewEntityCreation(this.model.vocabularies, this.model, 'class', this.searchText)
      .then(conceptCreation => this.$uibModalInstance.close(conceptCreation), ignoreModalClose);
  }

  createNewShape() {

    this.externalClass = undefined;
    this.cannotConfirm = null;
    this.$scope.form.$setPristine();
    this.selectedItem = null;
    this.$scope.form.editing = true;
    this.selection = new ExternalEntity(this.localizer.language, this.searchText, 'class');
  }

  showItemValue(value: Value) {
    return this.displayItemFactory.create({
      context: () => this.model,
      value: () => value
    }).displayValue;
  }

  generateSearchResultID(item: AbstractClass): string {
    return `${item.id.toString()}${'_search_class_link'}`;
  }

  showActions(item: AbstractClass) {
    return item ? !this.onlySelection && !item.isOfType('shape') && !item.definedBy.isOfType('standard') : false;
  }

  showClassInfo(item: Class | ExternalEntity) {
    return this.showClassInfoModal.open(this.model, item).then(null, modalCancelHandler);
  }

  copyClass(item: AbstractClass) {
    this.$uibModalInstance.close(new RelatedClass(item.id, 'prov:wasDerivedFrom'));
  }

  createSubClass(item: AbstractClass) {
    this.$uibModalInstance.close(new RelatedClass(item.id, 'rdfs:subClassOf'));
  }

  createSuperClass(item: AbstractClass) {
    this.$uibModalInstance.close(new RelatedClass(item.id, 'iow:superClassOf'));
  }

  itemTitle(item: AbstractClass) {

    const disabledReason = this.exclude(item);

    if (!!disabledReason) {
      return this.gettextCatalog.getString(disabledReason);
    } else {
      return null;
    }
  }

  isModelProfile() {
    return this.model.isOfType('profile');
  }
}

