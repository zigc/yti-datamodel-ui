import { IScope } from 'angular';
import { Location, LocationService } from 'app/services/locationService';
import { labelNameToResourceIdIdentifier } from 'yti-common-ui/utils/resource';
import { LanguageService } from 'app/services/languageService';
import { TranslateService } from '@ngx-translate/core';
import { LegacyComponent } from 'app/utils/angular';


@LegacyComponent({
  template: require('./breadcrumb.html')
})
export class BreadcrumbComponent {

  location: Location[];

  constructor($scope: IScope,
              locationService: LocationService,
              private languageService: LanguageService,
              private translateService: TranslateService) {
    'ngInject';
    $scope.$watch(() => locationService.location, location => {
      this.location = location;
    });
  }

  getIdNameFromLocation(location: Location) {
    return location.label ? labelNameToResourceIdIdentifier(this.languageService.translate(location.label)) 
                          : location.localizationKey ? this.translateService.instant(location.localizationKey)
                                                     : '';
  }
}
