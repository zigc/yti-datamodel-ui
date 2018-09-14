import { LegacyComponent } from 'app/utils/angular';
import { Notification, Story } from 'app/help/contract';
import { assertNever, Optional } from 'yti-common-ui/utils/object';
import { elementPositioning, Regions } from './utils';
import { IDocumentService } from 'angular';
import { InteractiveHelpController } from './interactiveHelpDisplay';

@LegacyComponent({
  bindings: {
    item: '<',
    helpController: '<'
  },
  template: `
        <div ng-if="$ctrl.regions" class="help-backdrop" ng-style="$ctrl.regions.top"></div>
        <div ng-if="$ctrl.regions" class="help-backdrop" ng-style="$ctrl.regions.right"></div>
        <div ng-if="$ctrl.regions" class="help-backdrop" ng-style="$ctrl.regions.bottom"></div>
        <div ng-if="$ctrl.regions" class="help-backdrop" ng-style="$ctrl.regions.left"></div>
  `
})
export class InteractiveHelpBackdropComponent {

  item?: Story|Notification;
  regions: Optional<Regions>;

  helpController: InteractiveHelpController;

  private static fullBackdrop = {
    top: { left: 0, top: 0, right: 0, bottom: 0 },
    right: { left: 0, top: 0, width: 0, height: 0 },
    bottom: { left: 0, top: 0, width: 0, height: 0 },
    left: { left: 0, top: 0, width: 0, height: 0 },
    focus: { left: 0, top: 0, width: 0, height: 0 }
  };

  constructor(private $document: IDocumentService) {
    'ngInject';
  }

  $onInit() {
    this.helpController.registerBackdrop(this);
  }

  setFullBackdrop() {
    this.regions = InteractiveHelpBackdropComponent.fullBackdrop;
  }

  updatePosition() {
    if (this.item) {
      this.regions = this.resolveRegions(this.item);
    }
  }

  private resolveRegions(item: Story|Notification): Optional<Regions> {
    switch (item.type) {
      case 'story':
        return InteractiveHelpBackdropComponent.calculateRegions(item, this.$document.width());
      case 'notification':
        return InteractiveHelpBackdropComponent.fullBackdrop;
      default:
        return assertNever(item, 'Unknown item type');
    }
  }

  private static calculateRegions(story: Story, documentWidth: number): Optional<Regions> {

    const positioning = InteractiveHelpBackdropComponent.calculateFocusPositioning(story);

    if (!positioning) {
      return null;
    }

    return {
      top: {
        left: 0,
        top: 0,
        right: 0,
        height: positioning.top - window.pageYOffset
      },
      right: {
        left: positioning.left + positioning.width,
        top: positioning.top - window.pageYOffset,
        width: documentWidth - positioning.left - positioning.width,
        height: positioning.height
      },
      bottom: {
        left: 0,
        top: positioning.top + positioning.height - window.pageYOffset,
        right: 0,
        bottom: 0
      },
      left: {
        left: 0,
        top: positioning.top - window.pageYOffset,
        width: positioning.left,
        height: positioning.height
      },
      focus: {
        left: positioning.left,
        top: positioning.top - window.pageYOffset,
        width: positioning.width,
        height: positioning.height
      }
    };
  }

  private static calculateFocusPositioning(story: Story) {

    if (!story || !story.focus) {
      return null;
    }

    const focusTo = story.focus;
    const focusToElementPositioning = elementPositioning(story.focus.element())!;

    if (!focusToElementPositioning) {
      return null;
    }

    const marginTop = focusTo.margin && focusTo.margin.top || 0;
    const marginRight = focusTo.margin && focusTo.margin.right || 0;
    const marginBottom = focusTo.margin && focusTo.margin.bottom || 0;
    const marginLeft = focusTo.margin && focusTo.margin.left || 0;

    return {
      width: focusToElementPositioning.width + marginLeft + marginRight,
      height: focusToElementPositioning.height + marginTop + marginBottom,
      left: focusToElementPositioning.left - marginLeft,
      top: focusToElementPositioning.top - marginTop
    };
  }
}
