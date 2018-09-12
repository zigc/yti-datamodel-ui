import { ILocationService, IScope } from 'angular';
import { IModalScope, IModalStackService } from 'angular-ui-bootstrap';
import { UserService } from 'app/services/userService';
import { ConfirmationModal } from './common/confirmationModal';
import { ComponentDeclaration, modalCancelHandler, nextUrl } from 'app/utils/angular';
import { HelpProvider } from './common/helpProvider';
import { LocationService } from 'app/services/locationService';
import { ConfigService } from 'app/services/configService';
import { forwardRef } from '@angular/core';

export const ApplicationComponent: ComponentDeclaration = {
  selector: 'application',
  template: require('./application.html'),
  controller: forwardRef(() => ApplicationController)
};

export class ApplicationController {

  applicationInitialized: boolean;
  showFooter: boolean;
  showGoogleAnalytics: boolean;
  helpProvider: HelpProvider|null;

  constructor($scope: IScope,
              private $location: ILocationService,
              $uibModalStack: IModalStackService,
              userService: UserService,
              confirmationModal: ConfirmationModal,
              private locationService: LocationService,
              configService: ConfigService) {

    'ngInject';

    userService.loggedIn$.subscribe(() => this.applicationInitialized = true);

    $scope.$watch(() => $location.path(), path => {
      this.showFooter = !path.startsWith('/model');
    });

    configService.getConfig().then(config => {
      this.showGoogleAnalytics = !config.dev;
    });

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

  navigateToInformation() {
    this.$location.url('/information');
  }
}
