import { IAttributes, ILocationService, IScope } from 'angular';
import { LocationService } from 'app/services/locationService';
import { LanguageService, Localizer } from 'app/services/languageService';
import { AdvancedSearchModal } from './advancedSearchModal';
import { Url } from 'app/entities/uri';
import { module as mod } from './module';
import { frontPageSearchLanguageContext, LanguageContext } from 'app/types/language';
import { ApplicationController } from './application';
import { HelpProvider } from './common/helpProvider';
import { FrontPageHelpService } from 'app/help/frontPageHelp';
import { modalCancelHandler } from 'app/utils/angular';
import { ModelService } from 'app/services/modelService';
import { ModelListItem } from 'app/entities/model';

mod.directive('frontPage', () => {
  return {
    restrict: 'E',
    scope: {},
    bindToController: true,
    template: require('./frontPage.html'),
    controllerAs: 'ctrl',
    controller: FrontPageController,
    require: ['frontPage', '^application'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [ctrl, applicationController]: [FrontPageController, ApplicationController]) {
      applicationController.registerHelpProvider(ctrl);
    }
  };
});

export class FrontPageController implements HelpProvider {

  private localizer: Localizer;
  models: ModelListItem[];
  helps = this.frontPageHelpService.getHelps();

  /* @ngInject */
  constructor(private $location: ILocationService,
              locationService: LocationService,
              modelService: ModelService,
              languageService: LanguageService,
              private advancedSearchModal: AdvancedSearchModal,
              private frontPageHelpService: FrontPageHelpService) {

    this.localizer = languageService.createLocalizer(frontPageSearchLanguageContext);
    locationService.atFrontPage();

    modelService.getModels().then(models => {
      this.models = models;
    });
  }

  get loading() {
    return this.models == null;
  }

  get context(): LanguageContext {
    return this.localizer.context;
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
