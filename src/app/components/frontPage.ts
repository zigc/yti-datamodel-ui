import { ILocationService, IScope } from 'angular';
import { LocationService } from '../services/locationService';
import { LanguageService } from '../services/languageService';
import { AdvancedSearchModal } from './advancedSearchModal';
import { ApplicationComponent } from './application';
import { HelpProvider } from './common/helpProvider';
import { FrontPageHelpService } from '../help/providers/frontPageHelpService';
import { LegacyComponent, modalCancelHandler } from '../utils/angular';
import { ModelService } from '../services/modelService';
import { ClassificationService } from '../services/classificationService';
import { Classification } from '../entities/classification';
import { Url } from '../entities/uri';
import { comparingLocalizable } from '../utils/comparator';
import { BehaviorSubject, combineLatest, concat, Observable, Subscription } from 'rxjs';
import { fromIPromise } from '../utils/observable';
import { anyMatching } from 'yti-common-ui/utils/array';
import { FilterOptions } from 'yti-common-ui/components/filter-dropdown.component';
import { KnownModelType, profileUseContexts, UseContext } from '../types/entity';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { OrganizationService } from '../services/organizationService';
import { AuthorizationManagerService } from '../services/authorizationManagerService';
import { Organization } from '../entities/organization';
import { labelNameToResourceIdIdentifier } from 'yti-common-ui/utils/resource';
import { debounceTime, skip, take } from 'rxjs/operators';
import { InteractiveHelp } from '../help/contract';
import { getDataModelingMaterialIcon, getInformationDomainSvgIcon } from 'yti-common-ui/utils/icons';
import { selectableStatuses, Status } from 'yti-common-ui/entities/status';
import { HelpService } from '../help/providers/helpService';
import { DeepSearchResourceHitList, IndexSearchService, ModelSearchResponse } from '../services/indexSearchService';
import { getInternalModelUrl, getInternalResourceUrl, IndexModel, IndexResource } from '../entities/index/indexEntities';
import { Localizable } from 'yti-common-ui/types/localization';

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
  statuses: FilterOptions<Status>;
  organizations: FilterOptions<Organization> | undefined;
  organizationMap: { [id: string]: Organization } = {};
  informationDomains: { node: Classification, count: number }[] | undefined;
  informationDomainMap: { [id: string]: Classification } = {};

  search$ = new BehaviorSubject('');
  searchResources$ = new BehaviorSubject(true);
  informationDomain$ = new BehaviorSubject<Classification | null>(null);
  modelType$ = new BehaviorSubject<KnownModelType | null>(null);
  useContext$ = new BehaviorSubject<UseContext | null>(null);
  organization$ = new BehaviorSubject<Organization | null>(null);
  status$ = new BehaviorSubject<Status | null>(null);

  modelResults$ = new BehaviorSubject<ModelSearchResponse>({
    totalHitCount: 0, pageSize: 0, pageFrom: 0, models: [], deepHits: {}
  });
  filteredModels: IndexModel[] = [];
  filteredDeepHits: { [domainId: string]: DeepSearchResourceHitList[] };

  subscriptionsToClean: Subscription[] = [];
  modelsLoaded = false;

  modelTypeIconDef = getDataModelingMaterialIcon;
  informationDomainIconSrc = getInformationDomainSvgIcon;

  constructor($scope: IScope,
              private gettextCatalog: GettextCatalog,
              private $location: ILocationService,
              private locationService: LocationService,
              private modelService: ModelService,
              private languageService: LanguageService,
              private advancedSearchModal: AdvancedSearchModal,
              private frontPageHelpService: FrontPageHelpService,
              private classificationService: ClassificationService,
              private organizationService: OrganizationService,
              private authorizationManagerService: AuthorizationManagerService,
              private helpService: HelpService,
              private indexSearchService: IndexSearchService) {

    'ngInject';

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

    this.statuses = [null, ...selectableStatuses].map(status => ({
      value: status,
      name: () => gettextCatalog.getString(status ? status : 'All statuses'),
      idIdentifier: () => status ? status : 'all_selected'
    }));
  }

  get loading() {
    return !this.modelsLoaded || !this.informationDomains || !this.organizations;
  }

  get search() {
    return this.search$.getValue();
  }

  set search(value: string) {
    this.search$.next(value);
  }

  get searchResources() {
    return this.searchResources$.getValue();
  }

  set searchResources(value: boolean) {
    this.searchResources$.next(value);
  }

  $onInit() {
    this.locationService.atFrontPage();
    this.helpService.registerProvider(this);

    const informationDomains$ = fromIPromise(this.classificationService.getClassifications());
    const organizations$ = fromIPromise(this.organizationService.getOrganizations());

    this.subscriptionsToClean.push(combineLatest(informationDomains$, organizations$).subscribe(([informationDomains, organizations]) => {
      this.organizations = [null, ...organizations].map(org => {
        return {
          value: org,
          name: () => org ? this.languageService.translate(org.label) : this.gettextCatalog.getString('All organizations'),
          idIdentifier: () => org ? labelNameToResourceIdIdentifier(this.languageService.translate(org.label)) : 'all_selected'
        }
      });
      organizations.map(org => this.organizationMap[org.id.toString()] = org);
      informationDomains.forEach(domain => this.informationDomainMap[domain.identifier] = domain);
      this.subscribeModels();
      this.filterModels(informationDomains);
    }));
  }

  $onDestroy() {
    this.helpService.unregisterProvider(this);
    for (const subscription of this.subscriptionsToClean) {
      subscription.unsubscribe();
    }
  }

  isInformationDomainSelected(domain: Classification) {
    return this.informationDomain$.getValue() === domain;
  }

  toggleInformationDomain(domain: Classification) {
    this.informationDomain$.next(this.isInformationDomainSelected(domain) ? null : domain);
  }

  selectModel(model: IndexModel) {
    this.$location.url(getInternalModelUrl(model));
  }

  selectResource(model: IndexModel, resource: IndexResource) {
    this.$location.url(getInternalResourceUrl(model, resource));
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

  informationDomainLabel(id: string): Localizable {
    const domain: Classification | undefined = this.informationDomainMap[id];
    if (domain) {
      return domain.label;
    }
    return { en: 'Domain not found' };
  }

  organizationLabel(id: string): Localizable {
    const org: Organization | undefined = this.organizationMap["urn:uuid:" + id];
    if (org) {
      return org.label;
    }
    return { en: 'Organization not found' };
  }

  allLanguagesLabel(label: Localizable): string | undefined {
    const exp = /<\/?b>/g;
    const keys = Object.keys(label);
    if (keys.length) {
      return keys.map(key => label[key].replace(exp, '') + ' (' + key + ')').join('\n');
    }
    return undefined;
  }

  private subscribeModels(): void {
    const initialSearchText$: Observable<string> = this.search$.pipe(take(1));
    const debouncedSearchText$: Observable<string> = this.search$.pipe(skip(1), debounceTime(500));
    const combinedSearchText$: Observable<string> = concat(initialSearchText$, debouncedSearchText$);
    const searchConditions$: Observable<[string, string, boolean]> = combineLatest(combinedSearchText$, this.languageService.language$, this.searchResources$);

    this.subscriptionsToClean.push(searchConditions$.subscribe(([text, language, searchResources]) => {
      this.indexSearchService.searchModels({
        query: text || undefined,
        searchResources: searchResources,
        sortLang: language,
        pageSize: 1000,
        pageFrom: 0
      }).subscribe(resp => {
        this.modelsLoaded = true;
        if (resp.totalHitCount != resp.models.length) {
          console.error(`Model search did not return all results. Got ${resp.models.length} (start: ${resp.pageFrom}, total hits: ${resp.totalHitCount})`);
        }
        this.modelResults$.next(resp);
      });
    }));
  }

  private filterModels(informationDomains: Classification[]): void {
    const localizer = this.languageService.createLocalizer();

    this.subscriptionsToClean.push(combineLatest(combineLatest(this.modelResults$, this.languageService.language$),
      combineLatest(this.search$, this.informationDomain$, this.modelType$, this.useContext$, this.organization$, this.status$))
      .subscribe(([[modelResult, language], [search, informationDomain, modelType, useContext, org, status]]) => {

        const ignoringInformationDomain = modelResult.models.filter(model =>
          typeMatches(modelType, model) &&
          useContextMatches(useContext, model) &&
          organizationMatches(org, model) &&
          statusMatches(status, model)
        );

        const modelCount: (domain: Classification) => number =
          (domain: Classification) => ignoringInformationDomain.filter(model => informationDomainMatches(domain, model)).length;
        this.informationDomains = informationDomains.map(domain => ({
          node: domain,
          count: modelCount(domain)
        })).filter(item => item.count > 0);
        this.informationDomains.sort(comparingLocalizable<{ node: Classification, count: number }>(localizer, item => item.node.label));

        this.filteredModels = ignoringInformationDomain.filter(model => informationDomainMatches(informationDomain, model));
        this.filteredModels.sort(comparingLocalizable<IndexModel>(localizer, m => m.label));
        this.filteredModels.map(filteredModel => filteredModel.isPartOf.sort(comparingLocalizable<string>(localizer, id => this.informationDomainLabel(id))));

        this.filteredDeepHits = {};
        if (modelResult.deepHits && Object.keys(modelResult.deepHits).length > 0) {
          const dhs = modelResult.deepHits;
          this.filteredModels.forEach(model => {
            const hit: DeepSearchResourceHitList[] | undefined = dhs[model.id];
            if (hit) {
              this.filteredDeepHits[model.id] = hit;
            }
          });
        }
      }));
  }

  private go(withIowUrl: { iowUrl(): Url | null }) {
    const url = withIowUrl.iowUrl();
    if (url) {
      this.$location.url(url);
    }
  }
}

function informationDomainMatches(classification: Classification | null, model: IndexModel) {
  return !classification || anyMatching(model.isPartOf, domain => classification.identifier === domain);
}

function typeMatches(type: KnownModelType | null, model: IndexModel) {
  return !type || model.type === type;
}

function useContextMatches(uc: UseContext | null, model: IndexModel) {
  return !uc || model.useContext === uc;
}

function organizationMatches(org: Organization | null, model: IndexModel) {
  return !org || anyMatching(model.contributor, modelOrgId => ("urn:uuid:" + modelOrgId) === org.id.toString());
}

function statusMatches(status: Status | null, model: IndexModel) {
  return !status || model.status === status;
}
