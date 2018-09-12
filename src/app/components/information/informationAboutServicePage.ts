import { LocationService } from 'app/services/locationService';
import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const InformationAboutServicePageComponent: ComponentDeclaration = {
  selector: 'informationAboutServicePage',
  template: require('./informationAboutServicePage.html'),
  controller: forwardRef(() => InformationAboutServicePageController)
};

class InformationAboutServicePageController {

  constructor(locationService: LocationService) {
    'ngInject';
    locationService.atInformationAboutService();
  }
}
