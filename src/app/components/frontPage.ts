import { ILocationService, IScope } from 'angular';
import { LocationService } from 'app/services/locationService';
import { LanguageService } from 'app/services/languageService';
import { AdvancedSearchModal } from './advancedSearchModal';
import { ApplicationController } from './application';
import { HelpProvider } from './common/helpProvider';
import { FrontPageHelpService } from 'app/help/frontPageHelp';
import { ComponentDeclaration, modalCancelHandler } from 'app/utils/angular';
import { ModelService } from 'app/services/modelService';
import { ModelListItem } from 'app/entities/model';
import { ClassificationService } from '../services/classificationService';
import { Classification } from 'app/entities/classification';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Url } from 'app/entities/uri';
import { Observable } from 'rxjs/Observable';
import { comparingLocalizable } from 'app/utils/comparator';
import { Subscription } from 'rxjs/Subscription';
import { fromIPromise } from 'app/utils/observable';
import { anyMatching } from 'yti-common-ui/utils/array';
import { matches } from 'yti-common-ui/utils/string';
import { forwardRef } from '@angular/core';
import { FilterOptions } from 'yti-common-ui/components/filter-dropdown.component';
import { KnownModelType } from '../types/entity';
import gettextCatalog = angular.gettext.gettextCatalog;
import { OrganizationService } from '../services/organizationService';
import { AuthorizationManagerService } from 'app/services/authorizationManagerService';
import { Organization } from '../entities/organization';

export const component: ComponentDeclaration = {
  selector: 'frontPage',
  template: require('./frontPage.html'),
  require: {
    applicationCtrl: '^application'
  },
  controller: forwardRef(() => FrontPageController)
};

export class FrontPageController implements HelpProvider {

  applicationCtrl: ApplicationController;

  helps = this.frontPageHelpService.getHelps();

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

  /* @ngInject */
  constructor($scope: IScope,
              private $location: ILocationService,
              locationService: LocationService,
              modelService: ModelService,
              languageService: LanguageService,
              gettextCatalog: gettextCatalog,
              private advancedSearchModal: AdvancedSearchModal,
              private frontPageHelpService: FrontPageHelpService,
              classificationService: ClassificationService,
              organizationService: OrganizationService,
              private authorizationManagerService: AuthorizationManagerService) {

    locationService.atFrontPage();
    const localizer = languageService.createLocalizer();

    this.modelTypes = [null, 'library', 'profile'].map(type => {
      return {
        value: type as KnownModelType,
        name: () => gettextCatalog.getString(type ? type : 'All types')
      }
    });

    organizationService.getOrganizations().then(organizations => {

      this.organizations = [null, ...organizations].map(org => {
        return {
          value: org,
          name: () => org ? languageService.translate(org.label) : gettextCatalog.getString('All organizations')
        }
      });
    });

    const models$ = fromIPromise(modelService.getModels()).do(() => this.modelsLoaded = true);
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

    this.subscriptionsToClean.push(Observable.combineLatest(classifications$, models$, this.search$, this.modelType$, this.organization$, languageService.language$)
      .subscribe(([classifications, models, search, modelType, org]) => {

        const matchingVocabularies = models.filter(model =>
          searchMatches(search, model) &&
          typeMatches(modelType, model) &&
          organizationMatches(org, model)
        );

        const modelCount = (classification: Classification) =>
          matchingVocabularies.filter(voc => classificationMatches(classification, voc)).length;

        this.classifications = classifications.map(c => ({ node: c, count: modelCount(c) }));
        this.classifications.sort(comparingLocalizable<{ node: Classification }>(localizer, c => c.node.label));
      }));

    this.subscriptionsToClean.push(Observable.combineLatest(models$, this.search$, this.classification$, this.modelType$, this.organization$, languageService.language$)
      .subscribe(([models, search, classification, modelType, org]) => {

        this.filteredModels = models.filter(model =>
          searchMatches(search, model) &&
          classificationMatches(classification, model) &&
          typeMatches(modelType, model) &&
          organizationMatches(org, model)
        );

        this.filteredModels.sort(comparingLocalizable<ModelListItem>(localizer, m => m.label));
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
