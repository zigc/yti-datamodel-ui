import { IAttributes, IDirectiveFactory, IScope, ITranscludeFunction } from 'angular';
import { isDefined } from 'yti-common-ui/utils/object';
import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    openId: '=',
    animate: '='
  },
  transclude: true,
  template: `<ng-transclude></ng-transclude>`
})
export class AccordionComponent {
  openId: any;
  animate: boolean;

  isOpen(id: any) {
    return this.openId === id;
  }

  toggleVisibility(id: any) {
    if (this.isOpen(id)) {
      this.openId = null;
    } else {
      this.openId = id;
    }
  }
}

@LegacyComponent({
  bindings: {
    id: '=',
    identifier: '='
  },
  transclude: {
    heading: 'accordionHeading',
    body: 'accordionBody'
  },
  require: {
    accordion: '^accordion'
  },
  template: `
      <div class="card" ng-class="{ show: $ctrl.isOpen() }">
        <div id="{{id + '_accordion_button'}}" class="card-header" ng-click="$ctrl.toggleVisibility()">
          <div accordion-transclude="heading"></div>
        </div>
        <div uib-collapse="!$ctrl.isOpen()" ng-if="$ctrl.isAnimate()">
          <div class="card-body" ng-class="{ show: $ctrl.isOpen() }">
            <div accordion-transclude="body"></div>
          </div>
        </div>
        <div class="collapse" ng-show="$ctrl.isOpen()" ng-if="!$ctrl.isAnimate()">
          <div class="card-body">
            <div accordion-transclude="body"></div>
          </div>
        </div>
      </div>
  `,
})
export class AccordionGroupComponent {

  id: string;
  identifier: string;

  accordion: AccordionComponent;

  isOpen() {
    return this.accordion && this.accordion.isOpen(this.identifier);
  }

  toggleVisibility() {
    this.accordion.toggleVisibility(this.identifier);
  }

  isAnimate() {
    return (this.accordion && isDefined(this.accordion.animate)) ? this.accordion.animate : true;
  }
}

interface AccordionGroupScope extends IScope {
  $ctrl: AccordionGroupComponent;
}

interface AccordionTranscludeAttributes extends IAttributes {
  accordionTransclude: 'heading' | 'body';
}

interface AccordionTranscludeScope extends IScope {
  isOpen: () => boolean;
}

export const AccordionTranscludeDirective: IDirectiveFactory = () => {
  return {
    restrict: 'A',
    require: '^accordionGroup',
    link($scope: AccordionGroupScope, element: JQuery, attributes: AccordionTranscludeAttributes, controller: AccordionGroupComponent, transclude: ITranscludeFunction) {
      function ngTranscludeCloneAttachFn(clone: JQuery, transcludeScope: AccordionTranscludeScope) {
        element.append(clone);
        transcludeScope.isOpen = () => controller.isOpen();
      }

      const slotName = attributes.accordionTransclude;
      transclude(ngTranscludeCloneAttachFn, undefined, slotName);
    }
  }
};

