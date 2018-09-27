import { LegacyComponent } from 'app/utils/angular';
import { labelNameToResourceIdIdentifier } from 'yti-common-ui/utils/resource';
import { TranslateService } from '@ngx-translate/core';

export interface Option {
  name: string;
  apply: () => void;
}

@LegacyComponent({
  bindings: {
    id: '@',
    options: '=',
    disabled: '='
  },
  transclude: true,
  template: `                
        <div ng-if="$ctrl.options.length > 1" class="btn-group pull-right" uib-dropdown>
          <button id="{{$ctrl.id + '_dropdown_title'}}"
                  type="button" 
                  class="btn btn-link dropdown-toggle"
                  ng-disabled="$ctrl.disabled"
                  uib-dropdown-toggle>
            <ng-transclude></ng-transclude>
          </button>
          
          <div uib-dropdown-menu>
            <a ng-repeat="option in $ctrl.options"
               id="{{$ctrl.formOptionIdIdentifier(option.name)}}"
               class="dropdown-item" 
               ng-click="option.apply()">{{option.name | translate}}</a>
          </div>
        </div>
        
        <button ng-if="$ctrl.options.length === 1"
                id="{{$ctrl.formOptionIdIdentifier($ctrl.options[0].name)}}"
                type="button"
                class="btn btn-link"
                ng-disabled="$ctrl.disabled"
                ng-click="$ctrl.options[0].apply()">
          {{$ctrl.options[0].name | translate}}
        </button>
  `
})
export class ButtonWithOptionsComponent {

  id: string;
  options: Option[];
  disabled: boolean;

  constructor(private translateService: TranslateService) {
    'ngInject';
  }

  $onInit() {
    if (!this.options || this.options.length === 0) {
      throw new Error('Empty options');
    }
  }

  formOptionIdIdentifier(label: string) {
    return `${this.id}_${labelNameToResourceIdIdentifier(this.translateService.instant(label))}_dropdown_option`;
  }
}
