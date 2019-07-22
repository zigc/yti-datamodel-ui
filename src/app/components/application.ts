import { ILocationService, IScope } from 'angular';
import { IModalScope, IModalStackService } from 'angular-ui-bootstrap';
import { UserService } from 'app/services/userService';
import { ConfirmationModal } from './common/confirmationModal';
import { LegacyComponent, modalCancelHandler, nextUrl } from 'app/utils/angular';
import { LocationService } from 'app/services/locationService';
import { ConfigService } from 'app/services/configService';
import { Subscription } from 'rxjs';

@LegacyComponent({
  template: require('./application.html'),
})
export class ApplicationComponent {

  applicationInitialized: boolean;
  showFooter: boolean;

  private subscriptions: Subscription[] = [];

  constructor($scope: IScope,
              private $location: ILocationService,
              $uibModalStack: IModalStackService,
              userService: UserService,
              confirmationModal: ConfirmationModal,
              private locationService: LocationService,
              configService: ConfigService) {

    'ngInject';

    this.subscriptions.push(userService.user$.subscribe(() => this.applicationInitialized = true));

    $scope.$watch(() => $location.path(), path => {
      this.showFooter = !path.startsWith('/model');
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
  }

  get location() {
    return this.locationService.location;
  }

  $onDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  navigateToInformation() {
    this.$location.url('/information');
  }
}
