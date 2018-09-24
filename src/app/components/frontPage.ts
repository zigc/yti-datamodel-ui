import { ILocationService, IScope } from 'angular';
import { LocationService } from 'app/services/locationService';
import { LanguageService } from 'app/services/languageService';
import { AdvancedSearchModal } from './advancedSearchModal';
import { ApplicationComponent } from './application';
import { HelpProvider } from './common/helpProvider';
import { FrontPageHelpService } from 'app/help/frontPageHelp';
import { LegacyComponent, modalCancelHandler } from 'app/utils/angular';
import { ModelService } from 'app/services/modelService';
import { ModelListItem } from 'app/entities/model';
import { ClassificationService } from 'app/services/classificationService';
import { Classification } from 'app/entities/classification';
import { Url } from 'app/entities/uri';
import { comparingLocalizable } from 'app/utils/comparator';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { fromIPromise } from 'app/utils/observable';
import { anyMatching } from 'yti-common-ui/utils/array';
import { matches } from 'yti-common-ui/utils/string';
import { FilterOptions } from 'yti-common-ui/components/filter-dropdown.component';
import { KnownModelType } from 'app/types/entity';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { OrganizationService } from 'app/services/organizationService';
import { AuthorizationManagerService } from 'app/services/authorizationManagerService';
import { Organization } from 'app/entities/organization';
import { labelNameToResourceIdIdentifier } from 'yti-common-ui/utils/resource';
import { tap } from 'rxjs/operators';
import { InteractiveHelp } from '../help/contract';

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
  organizations: FilterOptions<Organization>;

  search$ = new BehaviorSubject('');
  classification$ = new BehaviorSubject<Classification|null>(null);
  modelType$ = new BehaviorSubject<KnownModelType|null>(null);
  organization$ = new BehaviorSubject<Organization|null>(null);

  classifications: { node: Classification, count: number }[];
  filteredModels: ModelListItem[] = [];

  subscriptionsToClean: Subscription[] = [];
  modelsLoaded = false;

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
              private authorizationManagerService: AuthorizationManagerService) {

    'ngInject';

    locationService.atFrontPage();
    const localizer = languageService.createLocalizer();

    $scope.$watch(() => languageService.UILanguage, lang => {
      this.helps = frontPageHelpService.getHelps(lang);
    });

    this.modelTypes = [null, 'library', 'profile'].map(type => {
      return {
        value: type as KnownModelType,
        name: () => gettextCatalog.getString(type ? type : 'All types'),
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

    const models$ = fromIPromise(modelService.getModels()).pipe(tap(() => this.modelsLoaded = true));
    const classifications$ = fromIPromise(classificationService.getClassifications());

    function searchMatches(search: string, model: ModelListItem) {
      return !search || anyMatching(Object.values(model.label), value => matches(value, search));
    }

    function classificationMatches(classification: Classification|null, model: ModelListItem) {
      return !classification || anyMatching(model.classifications, c => c.id.equals(classification.id));
    }

    function typeMatches(type: KnownModelType|null, model: ModelListItem) {
      return !type || model.normalizedType === type;
    }

    function organizationMatches(org: Organization|null, model: ModelListItem) {
      return !org || anyMatching(model.contributors, modelOrg => modelOrg.id.equals(org.id));
    }

    this.subscriptionsToClean.push(combineLatest(classifications$, models$, this.search$, this.modelType$, this.organization$, languageService.language$)
      .subscribe(([classifications, models, search, modelType, org]) => {

        const matchingVocabularies = models.filter(model =>
          searchMatches(search, model) &&
          typeMatches(modelType, model) &&
          organizationMatches(org, model)
        );

        const modelCount = (classification: Classification) =>
          matchingVocabularies.filter(voc => classificationMatches(classification, voc)).length;

        this.classifications = classifications.map(c => ({ node: c, count: modelCount(c) })).filter(c => c.count > 0);
        this.classifications.sort(comparingLocalizable<{ node: Classification, count: number }>(localizer, c => c.node.label));        
      }));

    this.subscriptionsToClean.push(combineLatest(models$, this.search$, this.classification$, this.modelType$, this.organization$, languageService.language$)
      .subscribe(([models, search, classification, modelType, org]) => {

        this.filteredModels = models.filter(model =>
          searchMatches(search, model) &&
          classificationMatches(classification, model) &&
          typeMatches(modelType, model) &&
          organizationMatches(org, model)
        );

        this.filteredModels.sort(comparingLocalizable<ModelListItem>(localizer, m => m.label));
        this.filteredModels.map(filteredModel => filteredModel.classifications.sort(comparingLocalizable<Classification>(localizer, c => c.label)));
      }));
  }

  $onInit() {
    this.applicationCtrl.registerHelpProvider(this);
  }

  $onDestroy() {
    for (const subscription of this.subscriptionsToClean) {
      subscription.unsubscribe();
    }
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

  private go(withIowUrl: {iowUrl(): Url|null}) {

    const url = withIowUrl.iowUrl();

    if (url) {
      this.$location.url(url);
    }
  }
}
