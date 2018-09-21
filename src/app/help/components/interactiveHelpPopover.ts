import { LegacyComponent } from 'app/utils/angular';
import { Notification, Story } from 'app/help/contract';
import { assertNever, Optional, requireDefined } from 'yti-common-ui/utils/object';
import { IDocumentService, IScope } from 'angular';
import { arrowHeight, Dimensions, elementPositioning, isInWindow, isVisible, popupAnimationTimeInMs, Positioning, resolveArrowClass } from './utils';
import { InteractiveHelpController } from './interactiveHelpDisplay';

@LegacyComponent({
  bindings: {
    item: '<',
    helpController: '<'
  },
  template: `
        <span ng-class="$ctrl.arrowClass"></span>
      
        <div class="help-content-wrapper">
          <h3 ng-show="$ctrl.title" ng-bind="$ctrl.title.key | translate: $ctrl.title.context"></h3>
          <p ng-show="$ctrl.content" ng-bind="$ctrl.content.key | translate: $ctrl.content.context"></p>
          
          <button ng-show="$ctrl.showPrevious" 
                  ng-disabled="!$ctrl.helpController.canMoveToPrevious()" 
                  ng-click="$ctrl.helpController.moveToPreviousItem()" 
                  class="small button help-navigate" translate>previous</button>
                  
          <button ng-show="$ctrl.showNext" 
                  ng-disabled="!$ctrl.helpController.canMoveToNext()" 
                  ng-click="$ctrl.helpController.tryToMoveToNextItem()" 
                  class="small button help-navigate" translate>next</button>
                  
          <button ng-show="$ctrl.showClose" 
                  ng-disabled="!$ctrl.helpController.canMoveToNext()" 
                  ng-click="$ctrl.helpController.close(false)" 
                  class="small button help-next" translate>close</button>
                  
          <a ng-click="$ctrl.helpController.close(true)" class="help-close">&times;</a>
        </div>
  `
})
export class InteractiveHelpPopoverComponent {

  helpController: InteractiveHelpController;

  item?: Story|Notification;
  arrowClass: string[] = [];

  title: { key: string, context?: any };
  content?: { key: string, context?: any };
  showPrevious: boolean;
  showNext: boolean;
  showClose: boolean;

  positioning: Optional<Positioning>;

  constructor(private $scope: IScope,
              private $document: IDocumentService) {
    'ngInject';
  }

  $onInit() {
    this.helpController.registerPopover(this);
    this.$scope.$watch(() => this.item, item => this.arrowClass = resolveArrowClass(item));
  }

  setPositioning(positioning: Positioning) {

    const item = requireDefined(this.item);

    if (isInWindow(positioning)) {

      this.positioning = positioning;

      // apply positioning before applying content, content is applied in the middle of animation
      setTimeout(() => {
        this.$scope.$apply(() => {
          this.title = item.title;
          this.content = item.content;
          this.showNext = this.helpController.showNext;
          this.showPrevious = this.helpController.showPrevious;
          this.showClose = this.helpController.showClose;
        });
      }, popupAnimationTimeInMs / 2);
    }
  }

  style() {
    return this.positioning;
  }

  calculatePositioning(item: Story|Notification): Optional<Positioning> {

    const popoverDimensions = this.helpController.getPopoverDimensions();
    const documentDimensions = { width: this.$document.width(), height: this.$document.height() };

    switch (item.type) {
      case 'story':
        return InteractiveHelpPopoverComponent.calculateStoryPositioning(item, popoverDimensions, documentDimensions);
      case 'notification':
        return InteractiveHelpPopoverComponent.calculateNotificationPositioning(popoverDimensions);
      default:
        return assertNever(item, 'Unknown item type');
    }
  }

  private static calculateNotificationPositioning(popoverDimensions: Dimensions): Positioning {
    return InteractiveHelpPopoverComponent.calculateCenterPositioning(popoverDimensions);
  }

  private static calculateCenterPositioning(popoverDimensions: Dimensions) {
    return {
      top: window.innerHeight / 2 - popoverDimensions.height / 2,
      left: window.innerWidth / 2 - popoverDimensions.width / 2,
      width: popoverDimensions.width
    };
  }

  private static calculateStoryPositioning(story: Story, popoverDimensions: Dimensions, documentDimensions: Dimensions): Optional<Positioning> {

    const element = story.popover.element();

    if (!element || element.length === 0 || !isVisible(element[0])) {
      return null;
    }

    const popoverWidth = popoverDimensions.width;
    const popoverHeight = popoverDimensions.height;
    const destination = elementPositioning(element)!;
    const documentWidth = documentDimensions.width;
    const documentHeight = documentDimensions.height;

    function calculateUnrestricted() {
      switch (story.popover.position) {
        case 'left-down':
          return { top: destination.top, left: destination.left - popoverWidth - arrowHeight, width: popoverWidth, height: popoverHeight };
        case 'left-up':
          return { top: destination.bottom - popoverHeight, left: destination.left - popoverWidth - arrowHeight, width: popoverWidth, height: popoverHeight };
        case 'right-down':
          return { top: destination.top, left: destination.right + arrowHeight, width: popoverWidth, height: popoverHeight };
        case 'right-up':
          return { top: destination.bottom - popoverHeight, left: destination.right + arrowHeight, width: popoverWidth, height: popoverHeight };
        case 'top-right':
          return { top: destination.top - popoverHeight - arrowHeight, left: destination.left, width: popoverWidth, height: popoverHeight };
        case 'top-left':
          return { top: destination.top - popoverHeight - arrowHeight, left: destination.right - popoverWidth, width: popoverWidth, height: popoverHeight };
        case 'bottom-right':
          return { top: destination.bottom + arrowHeight, left: destination.left, width: popoverWidth, height: popoverHeight };
        case 'bottom-left':
          return { top: destination.bottom + arrowHeight, left: destination.right - popoverWidth, width: popoverWidth, height: popoverHeight };
        default:
          return assertNever(story.popover.position, 'Unsupported popover position');
      }
    }

    function cropToWindow(position: { left: number, top: number, width: number, height: number }) {

      let newLeft = position.left;
      let newTop = position.top;
      let newWidth: number|undefined = position.width;
      let newHeight: number|undefined = position.height;

      if (newLeft < 0) {
        newWidth += newLeft;
        newLeft = 0;
        newHeight = undefined; // allow to expand
      } else if (newTop < 0) {
        newHeight += newTop;
        newTop = 0;
        newWidth = undefined; // allow to expand
      }

      if (newWidth) {
        const right = newLeft + newWidth;

        if (right > documentWidth) {
          newWidth += documentWidth - right;
          newLeft = documentWidth - newWidth;
          newHeight = undefined; // allow to expand
        }
      }

      if (newHeight) {
        const bottom = newTop + newHeight;

        if (bottom > documentHeight) {
          newHeight += documentHeight - bottom;
          newTop = documentHeight - newHeight;
          newWidth = undefined; // allow to expand
        }
      }

      return { left: newLeft, top: newTop, width: newWidth, height: newHeight };
    }

    return cropToWindow(calculateUnrestricted());
  }
}
