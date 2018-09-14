import { LocationService } from 'app/services/locationService';
import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  template: require('./informationAboutServicePage.html')
})
export class InformationAboutServicePageComponent {

  constructor(locationService: LocationService) {
    'ngInject';
    locationService.atInformationAboutService();
  }
}
