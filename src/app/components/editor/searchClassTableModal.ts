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
import { BehaviorSubject, Subscription, Observable } from 'rxjs';
import { ResourceSearchResponse, IndexSearchService } from '../../services/indexSearchService';
import { IndexResource } from '../../entities/index/indexEntities';
import { Moment } from 'moment';

export const noExclude = (_item: IndexResource) => null;
export const defaultTextForSelection = (_klass: Class) => 'Use class';

export class SearchClassTableModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  private openModal(model: Model,
                    exclude: Exclusion<IndexResource>,
                    filterExclude: Exclusion<IndexResource>,
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
       exclude: Exclusion<IndexResource>,
       filterExclude: Exclusion<IndexResource> = exclude,
       textForSelection: (klass: Optional<Class>) => string): IPromise<ExternalEntity|EntityCreation|Class> {

    return this.openModal(model, exclude, filterExclude, false, false, textForSelection);
  }

  openWithOnlySelection(model: Model,
                        defaultToCurrentModel: boolean,
                        exclude: Exclusion<IndexResource>,
                        filterExclude: Exclusion<IndexResource> = exclude,
                        textForSelection: (klass: Optional<Class>) => string = defaultTextForSelection): IPromise<Class> {

    return this.openModal(model, exclude, filterExclude, defaultToCurrentModel, true, textForSelection);
  }
}

export interface SearchClassTableScope extends IScope {
  form: EditableForm;
}

class SearchClassTableController implements SearchController<IndexResource> {

  private classes: ClassListItem[] = [];
  private indexClasses: IndexResource[] = [];

  searchResults_old: (ClassListItem)[] = [];
  searchResults: (IndexResource)[] = [];
  selection: Class|ExternalEntity;
  searchText = '';
  cannotConfirm: string|null;
  loadingResults: boolean;
  selectedItem: IndexResource|null;
  showStatus: Status|null;
  showInfoDomain: Classification|null;
  infoDomains: Classification[];
  modelTypes: DefinedByType[];
  showModelType: DefinedByType|null;

  classResults$ = new BehaviorSubject<ResourceSearchResponse>({
    totalHitCount: 0, pageSize: 0, pageFrom: 0, resources: []
  });

  // undefined means not fetched, null means does not exist
  externalClass: Class|null|undefined;

  sortBy_old: SortBy<ClassListItem>;
  sortBy: SortBy<IndexResource>;

  private localizer: Localizer;

  contentMatchers_old = [
    { name: 'Label', extractor: (klass: ClassListItem) => klass.label },
    { name: 'Description', extractor: (klass: ClassListItem) => klass.comment },
    { name: 'Identifier', extractor: (klass: ClassListItem) => klass.id.compact }
  ];

  contentMatchers = [
    { name: 'Label', extractor: (klass: IndexResource) => klass.label },
    { name: 'Description', extractor: (klass: IndexResource) => klass.comment! },
    { name: 'Identifier', extractor: (klass: IndexResource) => klass.id }
  ];

  contentExtractors_old = this.contentMatchers_old.map(m => m.extractor);
  contentExtractors = this.contentMatchers.map(m => m.extractor);

  searchFilters_old: SearchFilter<ClassListItem>[] = [];
  searchFilters: SearchFilter<IndexResource>[] = [];

  subscriptionsToClean: Subscription[] = [];

  constructor(private $scope: SearchClassTableScope,
              private $uibModalInstance: IModalServiceInstance,
              private classService: ClassService,
              languageService: LanguageService,
              public model: Model,
              public exclude: Exclusion<IndexResource>,
              public filterExclude: Exclusion<IndexResource>,
              public defaultToCurrentModel: boolean,
              public onlySelection: boolean,
              public textForSelection: (klass: Optional<Class>) => string,
              private searchConceptModal: SearchConceptModal,
              private displayItemFactory: DisplayItemFactory,
              private gettextCatalog: GettextCatalog,
              classificationService: ClassificationService,
              protected showClassInfoModal: ShowClassInfoModal,
              modelService: ModelService,
              private indexSearchService: IndexSearchService) {
    'ngInject';
    this.localizer = languageService.createLocalizer(model);
    this.loadingResults = true;

    this.modelTypes = ['library', 'profile', 'standard'];

    this.sortBy = {    
      name: 'name',
      comparator: defaultLabelComparator(this.localizer, this.filterExclude),
      descOrder: false
    };

    const sortInfoDomains = () => {
      this.infoDomains.sort(comparingLocalizable<Classification>(this.localizer, infoDomain => infoDomain.label));
    }

    // HUOM: Indeksihaun yhteydessä luokitusten haku toteutettu etusivulla mallien fitteröinnin yhteydessä. Siitä voi katsoa mallia sopiiko tähän.
    classificationService.getClassifications().then(infoDomains => {

      modelService.getModels().then(models => {
        
        const modelCount = (infoDomain: Classification) =>
          models.filter(mod => infoDomainMatches(infoDomain, mod)).length;

        this.infoDomains = infoDomains.filter(infoDomain => modelCount(infoDomain) > 0);
        sortInfoDomains();
      });
    });

    const appendResults_old = (classes: ClassListItem[]) => {
      console.log(classes);
      this.classes = this.classes.concat(classes);
      this.search();
      this.loadingResults = false;
    };

    const appendResults = (classes: IndexResource[]) => {
      console.log(classes);
      this.indexClasses = this.indexClasses.concat(classes);
      this.search();
      this.loadingResults = false;
    };


    // IDEA: Voisiko indeksihaun tulokset muuttaa ClassListItem-olioiksi?

    classService.getAllClasses(model).then(appendResults_old);

    // if (model.isOfType('profile')) {
    //   // TODO: Pitää miettiä miten nämä ulkoiset luokat otetaan huomioon kun haut refaktoroidaan. Niille pitää mahdollisesti tehdä omat indeksiapit. Miika tekee tiketin asiasta.
    //   classService.getExternalClassesForModel(model).then(appendResults_old);
    // }

    this.subscriptionsToClean.push( // searchConditions$.subscribe(([text, language, searchResources]) => {
      this.indexSearchService.searchResources({
        type: 'class',
        pageSize: '50',
      }).subscribe(resp => {
        this.classResults$.next(resp);
      }));

    this.classResults$.subscribe(result => {
      console.log(result);

      // Täällä pitää hakea modelit ja verrata niiden id:eitä indexResourcen isDefinedBy:hin ja saada näin modelien labelit ja luokitukset ja tehdä siten DefinedBy-oliot IndexResourceen (sinne uusi constructor, johon ne välitetään tjsp.)
      // modelService.getModels()

      appendResults(result.resources);
    });

    // this.subscribeClasses();


    $scope.$watch(() => this.selection && this.selection.id, selectionId => {
      if (selectionId && this.selection instanceof ExternalEntity) {
        this.externalClass = undefined;
        classService.getExternalClass(selectionId, model).then(klass => this.externalClass = klass);
      }
    });

    this.addFilter(classListItem =>
      !this.showStatus || classListItem.item.status === this.showStatus
    );

    // this.addFilter(classListItem =>
    //   !this.showInfoDomain || contains(classListItem.item.definedBy.classifications.map(classification => classification.identifier), this.showInfoDomain.identifier)
    // );
    
    // this.addFilter(classListItem =>
    //   !this.showModelType || classListItem.item.definedBy.normalizedType === this.showModelType
    // );

    $scope.$watch(() => this.showStatus, ifChanged<Status|null>(() => this.search()));
    $scope.$watch(() => this.showModelType, ifChanged<DefinedByType|null>(() => this.search()));
    $scope.$watch(() => this.showInfoDomain, ifChanged<Classification|null>(() => this.search()));
    $scope.$watch(() => this.sortBy.name, ifChanged<string>(() => this.search()));
    $scope.$watch(() => this.sortBy.descOrder, ifChanged<Boolean>(() => this.search()));    
    $scope.$watch(() => languageService.getModelLanguage(model), ifChanged<Language>(() => {
      sortInfoDomains();
      this.search();
    }));   
  }

  $onDestroy() {
    for (const subscription of this.subscriptionsToClean) {
      subscription.unsubscribe();
    }
  }

  get items() {
    return this.indexClasses;
  }

  addFilter(searchFilter: SearchFilter<IndexResource>) {
    this.searchFilters.push(searchFilter);
  }

  get statuses() {
    return selectableStatuses;
  }

  isSelectionExternalEntity(): boolean {
    return this.selection instanceof ExternalEntity;
  }

  search() {
    // this.searchResults = [
    //    ...filterAndSortSearchResults(this.classes, this.searchText, this.contentExtractors_old, this.searchFilters_old, this.sortBy_old.comparator)
    // ];

    this.searchResults = [
       ...filterAndSortSearchResults(this.indexClasses, this.searchText, this.contentExtractors, this.searchFilters, this.sortBy.comparator)
    ];
  }

  canAddNew() {
    return !this.onlySelection && !!this.searchText;
  }

  canAddNewShape() {
    return this.canAddNew() && this.model.isOfType('profile');
  }

  selectItem(item: IndexResource) {

    this.selectedItem = item;
    this.externalClass = undefined;
    this.$scope.form.editing = false;
    this.$scope.form.$setPristine();

    this.cannotConfirm = this.exclude(item);

    // if (this.model.isNamespaceKnownToBeNotModel(item.isDefinedBy.id.toString())) {
    //   this.classService.getExternalClass(item.id, this.model).then(result => {
    //     this.selection = requireDefined(result); // TODO check if result can actually be null
    //     this.cannotConfirm = this.exclude(requireDefined(result));
    //   });
    // } else {
      this.classService.getClass(item.id, this.model).then(result => this.selection = result);
    // }
  }

  isSelected(item: IndexResource) {
    return this.selectedItem === item;
  }

  isDisabled(item: IndexResource) {
    return this.exclude(item);
  }

  loadingSelection(item: IndexResource) {
    const selection = this.selection;
    return item === this.selectedItem && (!selection || (selection instanceof Class && !(item.id === selection.id.uri)));
  }

  isExternalClassPending() {
    return this.isSelectionExternalEntity() && this.externalClass === undefined;
  }

  confirm() {
    const selection = this.selection;

    if (selection instanceof Class) {
      this.$uibModalInstance.close(this.selection);
    } else if (selection instanceof ExternalEntity) {
      // if (this.externalClass) {
      //   const exclude = this.exclude(this.externalClass);
      //   if (exclude) {
      //     this.cannotConfirm = exclude;
      //   } else {
      //     this.$uibModalInstance.close(this.externalClass);
      //   }
      // } else {
        this.$uibModalInstance.close(selection);
      // }
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

  showDateValue(value: Date) {

    // FIX: miten saadaan modified-tieto Moment-muotoiseksi tai muuten siististi luettavaan muotoon?
    // Tai sitten pitää muuttaa Date-muotoinen tieto siistiksi.
    // KYSY: Mitä tietomuotoa apista tuleva pvm oikeasto on? Nyt ei näytä käyvän Date:en tai Moment:iin.

    const isoDateFormat = 'YYYY-MM-DDTHH:mm:ssz';

    // export const dateSerializer: Serializer<Moment> = createSerializer(
    //   (data: Moment) => data.format(isoDateFormat),
    //   (data: any) => moment(data, isoDateFormat)
    // );

    // let formatted_date = value.getFullYear() + '-' + (value.getMonth() + 1) + '-' + value.getDate() + ' ' + value.getHours() + ':' + value.getMinutes() + ':' + value.getSeconds();
    // console.log(formatted_date);

    // console.log(value.format(isoDateFormat));

    return value;

    // return value.format(isoDateFormat);

  }

 
  generateSearchResultID(item: IndexResource): string {
    return `${item.id.toString()}${'_search_class_link'}`;
  }

  // showActions(item: IndexResource) {    
  //   return !this.onlySelection && !item.isOfType('shape') && !item.definedBy.isOfType('standard');
  // }

  // showClassInfo() {
  //   return this.showClassInfoModal.open(this.model, this.selection).then(null, modalCancelHandler);
  // }

  // copyClass(item: IndexResource) {
  //   this.$uibModalInstance.close(new RelatedClass(item.id, 'prov:wasDerivedFrom'));
  // }
  
  // createSubClass(item: IndexResource) {
  //   this.$uibModalInstance.close(new RelatedClass(item.id, 'rdfs:subClassOf'));
  // }
  
  // createSuperClass(item: IndexResource) {
  //   this.$uibModalInstance.close(new RelatedClass(item.id, 'iow:superClassOf'));
  // }

  itemTitle(item: IndexResource) {

    const disabledReason = this.exclude(item);

    if (!!disabledReason) {
      return this.gettextCatalog.getString(disabledReason);
    } else {
      return null;
    }
  }

  private subscribeClasses(): void {
    // const initialSearchText$: Observable<string> = this.search$.pipe(take(1));
    // const debouncedSearchText$: Observable<string> = this.search$.pipe(skip(1), debounceTime(500));
    // const combinedSearchText$: Observable<string> = concat(initialSearchText$, debouncedSearchText$);
    // const searchConditions$: Observable<[string, string, boolean]> = combineLatest(combinedSearchText$, this.languageService.language$, this.searchResources$);

    this.subscriptionsToClean.push( // searchConditions$.subscribe(([text, language, searchResources]) => {
      this.indexSearchService.searchResources({
        // query: this.searchText,
        type: 'class',
        // isDefinedBy: '',
        // sortLang: '',
        // sortField: '',
        // sortOrder: '',
        pageSize: '50',
        // pageFrom: '0' // pageFrom kertoo monennestako elementistä hakutuloksia aletaan näyttämään. sitä tarvitaan sivutuksessa.
      }).subscribe(resp => {
        // this.modelsLoaded = true;
        // if (resp.totalHitCount != resp.models.length) {
        //   console.error(`Model search did not return all results. Got ${resp.models.length} (start: ${resp.pageFrom}, total hits: ${resp.totalHitCount})`);
        // }
        this.classResults$.next(resp);
      }));

    // }));

    this.classResults$.subscribe(result => {
      console.log(result);
    });
  }

}

