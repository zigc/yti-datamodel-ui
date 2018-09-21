import { LegacyComponent } from 'app/utils/angular';
import { Notification, Story } from 'app/help/contract';
import { IScope } from 'angular';
import { requireDefined } from 'yti-common-ui/utils/object';
import { InteractiveHelpController } from './interactiveHelpDisplay';
import { elementPositioning, PopoverDimensionsProvider, resolveArrowClass } from './utils';

@LegacyComponent({
  bindings: {
    item: '<',
    helpController: '<'
  },
  template: `
        <span ng-class="$ctrl.arrowClass"></span>
      
        <div class="help-content-wrapper">
          <h3 ng-show="$ctrl.item.title">{{$ctrl.item.title.key | translate: $ctrl.item.title.context}}</h3>
          <p ng-show="$ctrl.item.content">{{$ctrl.item.content.key | translate: $ctrl.item.content.context}}</p>
          <button ng-show="$ctrl.helpController.showPrevious" class="small button help-navigate" translate>previous</button>
          <button ng-show="$ctrl.helpController.showNext" class="small button help-navigate" translate>next</button>
          <button ng-show="$ctrl.helpController.showClose" class="small button help-next" translate>close</button>
          <a class="help-close">&times;</a>
        </div>
  `
})
export class InteractiveHelpPopoverDimensionsCalculatorComponent implements PopoverDimensionsProvider {

  item: Story|Notification;
  helpController: InteractiveHelpController;
  arrowClass: string[] = [];

  constructor(private $scope: IScope,
              private $element: JQuery) {
    'ngInject';
  }

  $onInit() {
    this.helpController.registerPopoverDimensionsProvider(this);
    this.$scope.$watch(() => this.item, item => this.arrowClass = resolveArrowClass(item));
  }

  getDimensions(): { width: number; height: number } {
    return requireDefined(elementPositioning(this.$element));
  }
}
