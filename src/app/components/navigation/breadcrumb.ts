import { IScope } from 'angular';
import { LocationService, Location } from 'app/services/locationService';
import { labelNameToResourceIdName } from 'app/utils/resource';
import { LanguageService } from 'app/services/languageService';
import { TranslateService } from 'ng2-translate';

import { module as mod } from './module';

mod.directive('breadcrumb', () => {
  return {
    scope: {},
    restrict: 'E',
    template: require('./breadcrumb.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: BreadcrumbController
  };
});

class BreadcrumbController {

  location: Location;

  /* @ngInject */
  constructor($scope: IScope,
              locationService: LocationService,
              private languageService: LanguageService,
              private translateService: TranslateService) {
    $scope.$watch(() => locationService.location, location => {
      this.location = location;
    });
  }

  getIdNameFromLocation(location: Location) {
    return location.label ? labelNameToResourceIdName(this.languageService.translate(location.label)) 
                          : location.localizationKey ? this.translateService.instant(location.localizationKey)
                                                     : '';
  }
}
