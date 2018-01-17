import { module as mod } from './module';

mod.directive('buttonWithOptions', () => {
  return {
    restrict: 'E',
    scope: {
      options: '=',
      disabled: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    transclude: true,
    controller: ButtonWithOptionsController,
    template: `                
        <div ng-if="ctrl.options.length > 1" class="btn-group pull-right" uib-dropdown>
          <button type="button" 
                  class="btn btn-link dropdown-toggle"
                  ng-disabled="ctrl.disabled"
                  uib-dropdown-toggle>
            <ng-transclude></ng-transclude>
          </button>
          
          <div uib-dropdown-menu>
            <a ng-repeat="option in ctrl.options"
               class="dropdown-item" 
               ng-click="option.apply()">{{option.name | translate}}</a>
          </div>
        </div>
        
        <button ng-if="ctrl.options.length === 1" 
                type="button"
                class="btn btn-link"
                ng-disabled="ctrl.disabled"
                ng-click="ctrl.options[0].apply()">
          {{ctrl.options[0].name | translate}}
        </button>
    `
  };
});

export interface Option {
  name: string;
  apply: () => void;
}

class ButtonWithOptionsController {

  options: Option[];
  disabled: boolean;

  constructor() {
    if (!this.options || this.options.length === 0) {
      throw new Error('Empty options');
    }
  }
}
