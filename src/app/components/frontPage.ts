import { ILocationService, IScope } from 'angular';
import { LocationService } from '../services/locationService';
import { LanguageService } from '../services/languageService';
import { AdvancedSearchModal } from './advancedSearchModal';
import { ApplicationComponent } from './application';
import { HelpProvider } from './common/helpProvider';
import { FrontPageHelpService } from '../help/providers/frontPageHelpService';
import { LegacyComponent, modalCancelHandler } from '../utils/angular';
import { ModelService } from '../services/modelService';
import { ModelListItem } from '../entities/model';
import { ClassificationService } from '../services/classificationService';
import { Classification } from '../entities/classification';
import { Url } from '../entities/uri';
import { comparingLocalizable } from '../utils/comparator';
import { BehaviorSubject, combineLatest, Observable, ObservableInput, Subscription } from 'rxjs';
import { fromIPromise } from '../utils/observable';
import { anyMatching } from 'yti-common-ui/utils/array';
import { matches } from 'yti-common-ui/utils/string';
import { FilterOptions } from 'yti-common-ui/components/filter-dropdown.component';
import { KnownModelType, profileUseContexts, UseContext } from '../types/entity';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { OrganizationService } from '../services/organizationService';
import { AuthorizationManagerService } from '../services/authorizationManagerService';
import { Organization } from '../entities/organization';
import { labelNameToResourceIdIdentifier } from 'yti-common-ui/utils/resource';
import { tap } from 'rxjs/operators';
import { InteractiveHelp } from '../help/contract';
import { getDataModelingMaterialIcon, getInformationDomainSvgIcon } from 'yti-common-ui/utils/icons';
import { allStatuses, Status } from 'yti-common-ui/entities/status';
import { HelpService } from '../help/providers/helpService';

// XXX: fixes problem with type definition having strongly typed parameters ending with 6
function myCombineLatest<T, T2, T3, T4, T5, T6, T7, T8>(v1: ObservableInput<T>,
                                                        v2: ObservableInput<T2>,
                                                        v3: ObservableInput<T3>,
                                                        v4: ObservableInput<T4>,
                                                        v5: ObservableInput<T5>,
                                                        v6: ObservableInput<T6>,
                                                        v7: ObservableInput<T7>,
                                                        v8: ObservableInput<T8>): Observable<[T, T2, T3, T4, T5, T6, T7, T8]> {
  return combineLatest(v1, v2, v3, v4, v5, v6, v7, v8);
}

@LegacyComponent({
  template: require('./frontPage.html'),
  require: {
    applicationCtrl: '^application'
  }
})
export class FrontPageComponent implements HelpProvider {

  applicationCtrl: ApplicationComponent;

  helps: InteractiveHelp[] = [];

  modelTypes: FilterOptions<KnownModelType>;
  useContexts: FilterOptions<UseContext>;
  organizations: FilterOptions<Organization>;
  statuses: FilterOptions<Status>;

  search$ = new BehaviorSubject('');
  classification$ = new BehaviorSubject<Classification | null>(null);
  modelType$ = new BehaviorSubject<KnownModelType | null>(null);
  useContext$ = new BehaviorSubject<UseContext | null>(null);
  organization$ = new BehaviorSubject<Organization | null>(null);
  status$ = new BehaviorSubject<Status | null>(null);

  classifications: { node: Classification, count: number }[];
  filteredModels: ModelListItem[] = [];

  subscriptionsToClean: Subscription[] = [];
  modelsLoaded = false;

  modelTypeIconDef = getDataModelingMaterialIcon;
  informationDomainIconSrc = getInformationDomainSvgIcon;

  constructor($scope: IScope,
              private $location: ILocationService,
              locationService: LocationService,
              modelService: ModelService,
              languageService: LanguageService,
              gettextCatalog: GettextCatalog,
              private advancedSearchModal: AdvancedSearchModal,
              private frontPageHelpService: FrontPageHelpService,
              classificationService: ClassificationService,
              organizationService: OrganizationService,
              private authorizationManagerService: AuthorizationManagerService,
              private helpService: HelpService) {

    'ngInject';

    locationService.atFrontPage();
    const localizer = languageService.createLocalizer();

    $scope.$watch(() => languageService.UILanguage, lang => {
      this.helps = frontPageHelpService.getHelps(lang);
    });

    this.modelTypes = [null, 'library', 'profile'].map(type => {
      return {
        value: type as KnownModelType,
        name: () => gettextCatalog.getString(type ? type : 'All model types'),
        idIdentifier: () => type ? type : 'all_selected'
      }
    });

    this.useContexts = [null, ...profileUseContexts].map(type => {
      return {
        value: type as UseContext,
        name: () => gettextCatalog.getString(type ? type : 'All use contexts'),
        idIdentifier: () => type ? type : 'all_selected'
      }
    });

    organizationService.getOrganizations().then(organizations => {

      this.organizations = [null, ...organizations].map(org => {
        return {
          value: org,
          name: () => org ? languageService.translate(org.label) : gettextCatalog.getString('All organizations'),
          idIdentifier: () => org ? labelNameToResourceIdIdentifier(languageService.translate(org.label)) : 'all_selected'
        }
      });
    });

    this.statuses = [null, ...allStatuses].map(status => ({
      value: status,
      name: () => gettextCatalog.getString(status ? status : 'All statuses'),
      idIdentifier: () => status ? status : 'all_selected'
    }));

    const models$ = fromIPromise(modelService.getModels()).pipe(tap(() => this.modelsLoaded = true));
    const classifications$ = fromIPromise(classificationService.getClassifications());

    function searchMatches(search: string, model: ModelListItem) {
      return !search || anyMatching(Object.values(model.label), value => matches(value, search));
    }

    function classificationMatches(classification: Classification | null, model: ModelListItem) {
      return !classification || anyMatching(model.classifications, c => c.id.equals(classification.id));
    }

    function typeMatches(type: KnownModelType | null, model: ModelListItem) {
      return !type || model.normalizedType === type;
    }

    function useContextMatches(uc: UseContext | null, model: ModelListItem) {
      return !uc || model.useContext === uc;
    }

    function organizationMatches(org: Organization | null, model: ModelListItem) {
      return !org || anyMatching(model.contributors, modelOrg => modelOrg.id.equals(org.id));
    }

    function statusMatches(status: Status | null, model: ModelListItem) {
      return !status || model.status === status;
    }

    this.subscriptionsToClean.push(myCombineLatest(classifications$, models$, this.search$, this.modelType$, this.useContext$, this.organization$, this.status$, languageService.language$)
      .subscribe(([classifications, models, search, modelType, useContext, org, status]) => {

        const matchingModels = models.filter(model =>
          searchMatches(search, model) &&
          typeMatches(modelType, model) &&
          useContextMatches(useContext, model) &&
          organizationMatches(org, model) &&
          statusMatches(status, model)
        );

        const modelCount = (classification: Classification) =>
          matchingModels.filter(model => classificationMatches(classification, model)).length;

        this.classifications = classifications.map(c => ({ node: c, count: modelCount(c) })).filter(c => c.count > 0);
        this.classifications.sort(comparingLocalizable<{ node: Classification, count: number }>(localizer, c => c.node.label));
      }));

    this.subscriptionsToClean.push(myCombineLatest(models$, this.search$, this.classification$, this.modelType$, this.useContext$, this.organization$, this.status$, languageService.language$)
      .subscribe(([models, search, classification, modelType, useContext, org, status]) => {

        this.filteredModels = models.filter(model =>
          searchMatches(search, model) &&
          classificationMatches(classification, model) &&
          useContextMatches(useContext, model) &&
          typeMatches(modelType, model) &&
          organizationMatches(org, model) &&
          statusMatches(status, model)
        );

        this.filteredModels.sort(comparingLocalizable<ModelListItem>(localizer, m => m.label));
        this.filteredModels.map(filteredModel => filteredModel.classifications.sort(comparingLocalizable<Classification>(localizer, c => c.label)));
      }));
  }

  get loading() {
    return !this.modelsLoaded || this.classifications == null || this.modelTypes == null || this.organizations == null;
  }

  get search() {
    return this.search$.getValue();
  }

  set search(value: string) {
    this.search$.next(value);
  }

  $onInit() {
    this.helpService.registerProvider(this);
  }

  $onDestroy() {
    this.helpService.unregisterProvider(this);
    for (const subscription of this.subscriptionsToClean) {
      subscription.unsubscribe();
    }
  }

  isClassificationSelected(classification: Classification) {
    return this.classification$.getValue() === classification;
  }

  toggleClassification(classification: Classification) {
    this.classification$.next(this.isClassificationSelected(classification) ? null : classification);
  }

  selectModel(model: ModelListItem) {
    this.go(model);
  }

  openAdvancedSearch() {
    this.advancedSearchModal.open()
      .then(searchResult => this.go(searchResult), modalCancelHandler);
  }

  canAddModel() {
    return this.authorizationManagerService.canAddModel();
  }

  addLibrary() {
    this.addModel('library');
  }

  addProfile() {
    this.addModel('profile');
  }

  addModel(type: KnownModelType) {
    this.$location.path('/newModel');
    this.$location.search({ type });
  }

  private go(withIowUrl: { iowUrl(): Url | null }) {

    const url = withIowUrl.iowUrl();

    if (url) {
      this.$location.url(url);
    }
  }
}
