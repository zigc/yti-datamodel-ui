import { IPromise, IScope } from 'angular';
import { IModalService, IModalServiceInstance } from 'angular-ui-bootstrap';
import { EntityCreation, SearchConceptModal } from './searchConceptModal';
import { ClassService, RelatedClass } from '../../services/classService';
import { LanguageService, Localizer } from '../../services/languageService';
import { EditableForm } from '../../components/form/editableEntityController';
import { Exclusion, createDefinedByExclusion, combineExclusions, createClassTypeExclusion, createExistsExclusion } from '../../utils/exclusion';
import { SearchController, SearchFilter } from '../../types/filter';
import { AbstractClass, Class, ClassListItem } from '../../entities/class';
import { Model } from '../../entities/model';
import { ExternalEntity } from '../../entities/externalEntity';
import { defaultLabelComparator, filterAndSortSearchResults } from '../../components/filter/util';
import { Optional, requireDefined } from 'yti-common-ui/utils/object';
import { ignoreModalClose } from 'yti-common-ui/utils/modal';
import { selectableStatuses, Status } from 'yti-common-ui/entities/status';
import { ifChanged } from '../../utils/angular';
import { Classification } from '../../entities/classification';
import { ClassificationService } from '../../services/classificationService';
import { contains } from 'yti-common-ui/utils/array';
import { ModelService } from '../../services/modelService';
import { comparingLocalizable } from '../../utils/comparator';
import { Language } from '../../types/language';
import { DefinedByType, SortBy, ClassType } from '../../types/entity';
import { infoDomainMatches } from '../../utils/entity';
import { ShowClassInfoModal } from './showClassInfoModal';
import { SearchClassType } from '../../types/component';

export const noClassExclude = (_item: AbstractClass) => null;
export const defaultTextForSelection = (_klass: Class) => 'Use class';

export class SearchClassTableModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  open(model: Model,
       exclude: Exclusion<AbstractClass>,
       filterExclude: Exclusion<AbstractClass> = exclude,
       textForSelection: (klass: Optional<Class>) => string,
       classesAssignedToModel: Set<string>): IPromise<ExternalEntity | EntityCreation | Class> {

    return this.openModal(model, exclude, filterExclude, false, false, textForSelection, classesAssignedToModel);
  }

  openWithOnlySelection(model: Model,
                        defaultToCurrentModel: boolean,
                        exclude: Exclusion<AbstractClass>,
                        filterExclude: Exclusion<AbstractClass> = exclude,
                        textForSelection: (klass: Optional<Class>) => string = defaultTextForSelection): IPromise<Class> {

    return this.openModal(model, exclude, filterExclude, defaultToCurrentModel, true, textForSelection);
  }

  private openModal(model: Model,
                    exclude: Exclusion<AbstractClass>,
                    filterExclude: Exclusion<AbstractClass>,
                    defaultToCurrentModel: boolean,
                    onlySelection: boolean,
                    textForSelection: (klass: Optional<Class>) => string,
                    classesAssignedToModel?: Set<string>) {

    return this.$uibModal.open({
      template: require('./searchClassTableModal.html'),
      size: 'xl',
      windowClass: 'modal-full-height',
      controller: SearchClassTableController,
      controllerAs: '$ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        exclude: () => exclude,
        filterExclude: () => filterExclude,
        defaultToCurrentModel: () => defaultToCurrentModel,
        onlySelection: () => onlySelection,
        textForSelection: () => textForSelection,
        classesAssignedToModel: () => classesAssignedToModel
      }
    }).result;
  }
}

export interface SearchClassTableScope extends IScope {
  form: EditableForm;
}

class SearchClassTableController implements SearchController<ClassListItem> {

  searchResults: ClassListItem[] = [];
  selection: Class | ExternalEntity | null;
  searchText = '';
  cannotConfirm: string | null;
  loadingClasses: boolean;
  loadingExternalClasses: boolean;
  selectedItem: ClassListItem | null;
  showStatus: Status | null;
  showInfoDomain: Classification | null;
  infoDomains: Classification[];
  classTypes: ClassType[];
  modelTypes: DefinedByType[];
  showClassType: ClassType | null;
  showModelType: DefinedByType | null;
  showProfiles = false;
  showOnlyExternalClasses = false;
  // undefined means not fetched, null means does not exist
  externalClass: Class | null | undefined;
  sortBy: SortBy<ClassListItem>;
  contentMatchers = [
    { name: 'Label', extractor: (klass: ClassListItem) => klass.label },
    { name: 'Description', extractor: (klass: ClassListItem) => klass.comment },
    { name: 'Identifier', extractor: (klass: ClassListItem) => klass.id.compact }
  ];
  contentExtractors = this.contentMatchers.map(m => m.extractor);
  searchFilters: SearchFilter<ClassListItem>[] = [];
  private classes: ClassListItem[] = [];
  private internalClasses: ClassListItem[] = [];
  private externalClasses: ClassListItem[] = [];
  private localizer: Localizer;

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
              public classesAssignedToModel: Set<string>,
              private searchConceptModal: SearchConceptModal,
              classificationService: ClassificationService,
              protected showClassInfoModal: ShowClassInfoModal,
              private modelService: ModelService) {
    'ngInject';
    this.localizer = languageService.createLocalizer(model);
    this.loadingClasses = true;
    this.loadingExternalClasses = true;

    this.classTypes = ['class', 'shape'];
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
      this.loadingClasses = false;
    };

    const externalResults = (classes: ClassListItem[]) => {
      this.externalClasses = classes;
      this.search();
      this.loadingExternalClasses = false;
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
      !this.showClassType || classListItem.item.normalizedType === this.showClassType
    );

    this.addFilter(classListItem =>
      !this.showModelType || classListItem.item.definedBy.normalizedType === this.showModelType
    );

    this.addFilter(classListItem =>
      this.showProfiles || !classListItem.item.definedBy.isOfType('profile')
    );

    $scope.$watch(() => this.showStatus, ifChanged<Status | null>(() => this.search()));
    $scope.$watch(() => this.showClassType, ifChanged<ClassType | null>(() => this.search()));
    $scope.$watch(() => this.showModelType, ifChanged<DefinedByType | null>(() => this.search()));
    $scope.$watch(() => this.showInfoDomain, ifChanged<Classification | null>(() => this.search()));
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
        this.showClassType = null;
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

  get loadingResults(): boolean {
    if (this.showOnlyExternalClasses) {
      return this.loadingExternalClasses;
    }
    return this.loadingClasses;
  }

  get items() {
    return this.classes;
  }

  get statuses() {
    return selectableStatuses;
  }

  addFilter(searchFilter: SearchFilter<ClassListItem>) {
    this.searchFilters.push(searchFilter);
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
      ...filterAndSortSearchResults(this.classes, this.searchText, this.contentExtractors, this.searchFilters, this.sortBy.comparator, 0)
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
    this.cannotConfirm = null;
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

  showActions(item: Class | ExternalEntity | null) {
    return item && item instanceof Class ? !this.onlySelection && !item.isOfType('shape') && !item.definedBy.isOfType('standard') : false;
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

  addNamespaceToModel(item: AbstractClass) {

    this.modelService.newModelRequirement(this.model, item.id.uri).then(response => {

      this.modelService.getModelByPrefix(this.model.prefix).then(model => {
        this.model.importedNamespaces = model.importedNamespaces;
        this.model.context = model.context;

        if (item.normalizedType === 'class' || item.normalizedType === 'shape') {
          if (this.model.isOfType('profile')) {
            // profiles can create multiple shapes of single class so exists exclusion is not wanted
            // profiles can create copy of shapes so type exclusion is not wanted
            this.exclude = createDefinedByExclusion(this.model);
          } else {
            this.exclude = combineExclusions<AbstractClass>(
              createClassTypeExclusion(SearchClassType.Class),
              createDefinedByExclusion(this.model),
              createExistsExclusion(this.classesAssignedToModel));
          }
        }

        this.cannotConfirm = this.exclude(item);
        this.selectItem(item);
      });
    });
  }

  isModelProfile() {
    return this.model.isOfType('profile');
  }

  notDefinedByThisModel(item: AbstractClass) {
    const definedByExclude = createDefinedByExclusion(this.model);

    return item && !!this.exclude(item) ? this.exclude(item) === definedByExclude(item) : false;
  }
}
