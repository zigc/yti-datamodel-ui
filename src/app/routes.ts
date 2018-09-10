import * as angular from 'angular';
import { Uri } from './entities/uri';
import { ILocationService } from 'angular';
import { resourceUrl, modelUrl } from './utils/entity';
import { NotificationModal } from './components/common/notificationModal';

/* @ngInject */
export function routeConfig($routeProvider: angular.route.IRouteProvider) {
  $routeProvider
    .when('/', {
      template: '<front-page></front-page>'
    })
    .when('/information', {
      template: '<information-about-service-page></information-about-service-page>'
    })
    .when('/user', {
      template: '<user-page></user-page>'
    })
    .when('/group', {
      template: '<group-page group-id="groupId"></group-page>',
      controller($scope: any, $route: angular.route.IRouteService) {
        $scope.groupId = new Uri($route.current!.params.id, {});
      }
    })
    .when('/newModel', {
      template: '<new-model-page type="type"></new-model-page>',
      controller($scope: any, $route: angular.route.IRouteService) {
        const params: any = $route.current!.params;
        $scope.type = params.type;
      }
    })
    .when('/ns/:prefix*', {
      template: '',
      controller($location: ILocationService, $route: angular.route.IRouteService) {
        const prefix = $route.current!.params.prefix;
        const resource = $location.hash();

        if (resource) {
          $location.url(resourceUrl(prefix, resource));
        } else {
          $location.url(modelUrl(prefix));
        }
      }
    })
    .when('/model/:prefix/:resource?/:property?', {
      template: '<model-page></model-page>',
      reloadOnSearch: false
    })
    .otherwise({
      template: '',
      /* @ngInject */
      controller(notificationModal: NotificationModal) {
        notificationModal.openPageNotFound();
      }
    });
}
