import { IScope, ILocationService } from 'angular';
import { UserService } from 'app/services/userService';
import { LocationService } from 'app/services/locationService';
import { module as mod } from './module';
import { Uri } from 'app/entities/uri';
import { groupUrl } from 'app/utils/entity';
import { User } from 'yti-common-ui/services/user.service';

mod.directive('userPage', () => {
  return {
    restrict: 'E',
    template: require('./userPage.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: UserPageController
  };
});

class UserPageController {

  user: User;

  /* @ngInject */
  constructor($scope: IScope, $location: ILocationService, userService: UserService, locationService: LocationService) {
    locationService.atUser();

    $scope.$watch(() => userService.user, user => {
      if (user instanceof User) {
        this.user = user;
      } else {
        $location.url('/');
      }
    });
  }

  groupUrl(id: Uri) {
    return groupUrl(id.uri);
  }
}
