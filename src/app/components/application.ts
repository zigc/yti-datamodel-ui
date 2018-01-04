import { ILocationService, IScope, ui } from 'angular';
import IModalScope = ui.bootstrap.IModalScope;
import IModalStackService = ui.bootstrap.IModalStackService;
import { UserService } from 'app/services/userService';
import { config } from 'config';
import { ConfirmationModal } from './common/confirmationModal';
import { module as mod } from './module';
import { nextUrl, modalCancelHandler } from 'app/utils/angular';
import { HelpProvider } from './common/helpProvider';
import { LocationService } from 'app/services/locationService';

mod.directive('application', () => {
  return {
    restrict: 'E',
    template: require('./application.html'),
    bindToController: true,
    controllerAs: 'ctrl',
    controller: ApplicationController
  };
});

export class ApplicationController {

  applicationInitialized: boolean;
  showFooter: boolean;
  production: boolean;
  helpProvider: HelpProvider|null;

  /* @ngInject */
  constructor($scope: IScope,
              $location: ILocationService,
              $uibModalStack: IModalStackService,
              userService: UserService,
              confirmationModal: ConfirmationModal,
              private locationService: LocationService) {

    userService.loggedIn$.subscribe(() => this.applicationInitialized = true);

    $scope.$watch(() => $location.path(), path => {
      this.showFooter = !path.startsWith('/model');
    });

    this.production = config.environment === 'production';

    $scope.$on('$locationChangeStart', (event, next) => {

      const modal = $uibModalStack.getTop();

      if (!!modal) {
        const modalScope: IModalScope = modal.value.modalScope;

        event.preventDefault();

        confirmationModal.openCloseModal().then(() => {
          modalScope.$dismiss('cancel');
          $location.url(nextUrl($location, next));
        }, modalCancelHandler);
      }
    });

    $scope.$on('$routeChangeSuccess', () => {
      // reset help provider since every route is not guaranteed to register provider
      this.helpProvider = null;
    });
  }

  get location() {
    return this.locationService.location;
  }

  registerHelpProvider(helpProvider: HelpProvider) {
    this.helpProvider = helpProvider;
  }
}
