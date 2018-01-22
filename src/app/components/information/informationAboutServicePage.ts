import { module as mod } from './module';
import { LocationService } from 'app/services/locationService';

mod.directive('informationAboutServicePage', () => {
  return {
    restrict: 'E',
    template: require('./informationAboutServicePage.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    scope: {
    },
    controller: InformationAboutServicePageController,
  };
});

class InformationAboutServicePageController {

  constructor(locationService: LocationService) {
    locationService.atInformationAboutService();
  }
}
