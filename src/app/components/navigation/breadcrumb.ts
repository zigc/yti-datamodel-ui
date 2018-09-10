import { IScope } from 'angular';
import { Location, LocationService } from 'app/services/locationService';
import { labelNameToResourceIdIdentifier } from 'yti-common-ui/utils/resource';
import { LanguageService } from 'app/services/languageService';
import { TranslateService } from '@ngx-translate/core';
import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const BreadcrumbComponent: ComponentDeclaration = {
  selector: 'breadcrumb',
  template: require('./breadcrumb.html'),
  controller: forwardRef(() => BreadcrumbController)
};

class BreadcrumbController {

  location: Location[];

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
    return location.label ? labelNameToResourceIdIdentifier(this.languageService.translate(location.label)) 
                          : location.localizationKey ? this.translateService.instant(location.localizationKey)
                                                     : '';
  }
}
