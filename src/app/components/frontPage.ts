import { ILocationService } from 'angular';
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

  models: ModelListItem[];
  helps = this.frontPageHelpService.getHelps();

  search$ = new BehaviorSubject('');
  classification$ = new BehaviorSubject<Classification|null>(null);

  classifications: { node: Classification, count: number }[];
  filteredModels: ModelListItem[] = [];

  subscriptionsToClean: Subscription[] = [];

  /* @ngInject */
  constructor(private $location: ILocationService,
              locationService: LocationService,
              modelService: ModelService,
              languageService: LanguageService,
              private advancedSearchModal: AdvancedSearchModal,
              private frontPageHelpService: FrontPageHelpService,
              classificationService: ClassificationService) {

    locationService.atFrontPage();
    const localizer = languageService.createLocalizer();

    const models$ = fromIPromise(modelService.getModels());
    const classifications$ = fromIPromise(classificationService.getClassifications(this.classification$.getValue()));

    this.subscriptionsToClean.push(Observable.combineLatest(models$, languageService.language$)
      .subscribe(([models]) => {
        this.models = models;
        this.models.sort(comparingLocalizable<ModelListItem>(localizer, m => m.label));
      }));

    function searchMatches(search: string, model: ModelListItem) {
      return !search || anyMatching(Object.values(model.label), value => matches(value, search));
    }

    function classificationMatches(classification: Classification|null, model: ModelListItem) {
      return !classification || anyMatching(model.classification, c => c.id.equals(classification.id));
    }

    Observable.combineLatest(classifications$, models$, this.search$)
      .subscribe(([classifications, vocabularies, search]) => {

        const matchingVocabularies = vocabularies.filter(vocabulary =>
          searchMatches(search, vocabulary)
        );

        const modelCount = (classification: Classification) =>
          matchingVocabularies.filter(voc => classificationMatches(classification, voc)).length;

        this.classifications = classifications.map(c => ({ node: c, count: modelCount(c) }));
        this.classifications.sort(comparingLocalizable<{ node: Classification }>(localizer, c => c.node.label));
      });

    Observable.combineLatest(models$, this.search$, this.classification$)
      .subscribe(([models, search, classification]) => {

        this.filteredModels = models.filter(model =>
          searchMatches(search, model) &&
          classificationMatches(classification, model)
        );
      });
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
    return this.models == null || this.classifications == null; // || !this.organizations$;
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

  private go(withIowUrl: {iowUrl(): Url|null}) {

    const url = withIowUrl.iowUrl();

    if (url) {
      this.$location.url(url);
    }
  }
}
