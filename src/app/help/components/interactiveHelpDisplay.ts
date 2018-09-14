import * as _ from 'lodash';
import { OverlayInstance, OverlayService } from 'app/components/common/overlay';
import { IDocumentService, ILocationService, IPromise, IScope, IWindowService } from 'angular';
import { IModalStackService } from 'angular-ui-bootstrap';
import { assertNever, Optional, requireDefined } from 'yti-common-ui/utils/object';
import { enter, esc, tab } from 'yti-common-ui/utils/key-code';
import { isTargetElementInsideElement, nextUrl } from 'app/utils/angular';
import { InteractiveHelpService } from 'app/help/services/interactiveHelpService';
import { createScrollWithDefault, InteractiveHelp, NextCondition, Notification, Story } from 'app/help/contract';
import { ConfirmationModal } from 'app/components/common/confirmationModal';
import { moveCursorToEnd, scrollToTop } from 'app/help/utils';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { NgZone } from '@angular/core';
import {
  arrowHeight,
  elementExists,
  elementPositioning, isClick,
  isFocusInElement,
  isNumberInMargin,
  isPositionInMargin,
  isVisible,
  PopoverDimensionsProvider,
  Positioning,
  stopEvent
} from './utils';
import { InteractiveHelpPopoverComponent } from './interactiveHelpPopover';
import { InteractiveHelpBackdropComponent } from './interactiveHelpBackdrop';

const focusableSelector = 'a[href], area[href], input:not([disabled]), ' +
  'button:not([disabled]),select:not([disabled]), textarea:not([disabled]), ' +
  'iframe, object, embed, *[tabindex], *[contenteditable=true]';

export class InteractiveHelpDisplay {

  constructor(private overlayService: OverlayService,
              private interactiveHelpService: InteractiveHelpService,
              private gettextCatalog: GettextCatalog) {
    'ngInject';
  }

  open(help: InteractiveHelp) {

    if (!help) {
      throw new Error('No help defined');
    }

    if (this.interactiveHelpService.isOpen()) {
      throw new Error('Cannot open help when another help is already open');
    }

    const originalGettextCatalogDebug = this.gettextCatalog.debug;

    const stateInitialization = () => {
      this.gettextCatalog.debug = false;
      return help.onInit ? help.onInit(this.interactiveHelpService) : this.interactiveHelpService.reset().then(() => false);
    };

    this.interactiveHelpService.open();

    return this.overlayService.open({
      template: `
          <help-popover ng-show="$ctrl.item" item="$ctrl.item" help-controller="$ctrl" ng-style="$ctrl.popoverController.style()"></help-popover>
          <help-popover-dimensions-calculator ng-show="$ctrl.item" item="$ctrl.item" help-controller="$ctrl"></help-popover-dimensions-calculator>
          <help-backdrop item="$ctrl.item" help-controller="$ctrl"></help-backdrop>
          <div ng-show="$ctrl.item.denyInteraction" class="help-interaction-stopper"></div>
        `,
      controller: InteractiveHelpController,
      controllerAs: '$ctrl',
      resolve: {
        help: () => help,
        stateInitialization: () => stateInitialization
      },
      disableScroll: true
    }).result.then(() => {
      this.interactiveHelpService.close();
      this.gettextCatalog.debug = originalGettextCatalogDebug;
    });
  }
}

export class InteractiveHelpController {

  item?: Story|Notification;
  items: (Story|Notification)[];
  activeIndex = 0;
  changingLocation = false;

  popoverController: InteractiveHelpPopoverComponent;
  popoverDimensionsProvider: PopoverDimensionsProvider;
  backdropController: InteractiveHelpBackdropComponent;

  currentScrollTop?: number;
  inTransition = false;

  constructor(private $scope: IScope,
              private $overlayInstance: OverlayInstance,
              private $document: IDocumentService,
              private $location: ILocationService,
              private $uibModalStack: IModalStackService,
              private confirmationModal: ConfirmationModal,
              private help: InteractiveHelp,
              private stateInitialization: () => IPromise<boolean>,
              private $window: IWindowService,
              private zone: NgZone) {
    'ngInject';
  }

  $onInit() {

    let continuing = false;

    this.stateInitialization().then(willChangeLocation => {
      continuing = willChangeLocation;
      // Reset expectation if navigation event happened before construction
      setTimeout(() => continuing = false, 500);
      this.items = this.help.storyLine.items();

      if (this.items.length === 0) {
        throw new Error('No stories defined');
      }

      this.showItem(0);
    });

    this.$scope.$on('$locationChangeStart', (event, next) => {
      if (!continuing) {
        event.preventDefault();

        // delay is needed so that click handler has time to modify flag
        setTimeout(() => {
          if (this.changingLocation) {
            continuing = true;
            this.$scope.$apply(() => {
              this.$location.url(nextUrl(this.$location, next));
              this.moveToNextItem();
            });
          } else {
            this.confirmationModal.openCloseHelp().then(() => this.close(true));
          }
        });
      } else {
        continuing = false;
      }
    });

    const debounceUpdatePositions = _.debounce(() => this.updatePositions(), 200);

    this.$scope.$watch(() => this.item, debounceUpdatePositions);

    const itemPopoverPositioning = () => (this.item && this.item.type === 'story') ? elementPositioning(this.item.popover.element()) : null;
    const itemFocusPositioning = () => this.item && this.item.type === 'story' && this.item.focus ? elementPositioning(this.item.focus.element()) : null;
    const itemScrollPositioning = () => {

      if (!this.item) {
        return null;
      }

      const scroll = InteractiveHelpController.resolveScroll(this.item);

      if (scroll.type !== 'scroll-none') {
        return elementPositioning(scroll.element());
      }

      return null;
    };

    const keyDownHandler = (event: JQueryEventObject) => this.keyDownHandler(event);
    const clickHandler = (event: JQueryEventObject) => this.clickHandler(event);

    function updateIfNeeded(newPos: Positioning|null, oldPos: Positioning|null) {
      if (!isPositionInMargin(1, newPos, oldPos)) {
        debounceUpdatePositions();
      }
    }

    // Additional checks for sub-pixel fluctuation are needed for example because of float (fixed style)
    this.$scope.$watch(itemPopoverPositioning, updateIfNeeded, true);
    this.$scope.$watch(itemFocusPositioning, updateIfNeeded, true);
    this.$scope.$watch(itemScrollPositioning, updateIfNeeded, true);

    this.$scope.$watch(() => this.getPopoverDimensions(), debounceUpdatePositions, true);

    this.zone.runOutsideAngular(() => {
      window.addEventListener('resize', debounceUpdatePositions);
      window.addEventListener('scroll', debounceUpdatePositions);
    });

    // Lazy initialization of listeners so that it doesn't intervene with help opening event
    setTimeout(() => {
      this.$document.on('keydown', keyDownHandler);
      this.$document.on('click', clickHandler);
    });

    this.$scope.$on('$destroy', () => {
      window.removeEventListener('resize', debounceUpdatePositions);
      window.removeEventListener('scroll', debounceUpdatePositions);
      this.$document.off('keydown', keyDownHandler);
      this.$document.off('click', clickHandler);
    });
  }

  showItem(index: number) {

    const item = this.items[index];

    if (item.type === 'story' && item.initialize) {

      const tryToInitialize = (init: () => boolean, retryCount = 0) => {
        const success = init();
        if (!success) {
          if (retryCount > 10) {
            console.log(item);
            throw new Error('Cannot initialize');
          } else {
            setTimeout(() => tryToInitialize(init, retryCount + 1), 100);
          }
        }
      };

      tryToInitialize(item.initialize);
    }

    // show full backdrop if item has focus while waiting for debounce
    if (item && (item.type === 'notification' || item.focus)) {
      if (this.backdropController) {
        this.backdropController.setFullBackdrop();
      }
    }

    this.manageActiveElement(item);

    this.inTransition = true;
    this.currentScrollTop = undefined;
    this.item = item;
  }

  private manageActiveElement(item: Story|Notification) {
    // Handle focus off frame since it can cause duplicate digest
    setTimeout(() => {

      // Active element needs to be blurred because it can used for example for multiple interactive help activations
      (document.activeElement as HTMLElement).blur();

      if (item && item.type === 'story' && item.focus && !item.denyInteraction) {

        const focusElement = item.focus.element();

        if (focusElement.length > 0 && isVisible(focusElement[0])) {
          const focusable = focusElement.find(focusableSelector).addBack(focusableSelector).eq(0);
          focusable.focus();
          moveCursorToEnd(focusable);
        } else {
          setTimeout(() => this.manageActiveElement(item), 100);
        }
      }
    });
  }

  private updatePositions(retryCount = 0) {

    if (!this.item) {
      return;
    }

    const positioning = this.popoverController.calculatePositioning(this.item);

    if (positioning) {
      this.scrollTo(this.item, () => {
        this.$scope.$apply(() => {
          this.inTransition = false;
          this.popoverController.setPositioning(positioning);
          this.backdropController.updatePosition();
        });
      });
    } else {
      if (retryCount > 10) {
        console.log(this.item);
        throw new Error('Popover element not found');
      } else {
        setTimeout(() => this.updatePositions(retryCount + 1), 100);
      }
    }
  }

  private static resolveScroll(item: Story|Notification) {
    return item.type === 'notification' ? scrollToTop : item.scroll || createScrollWithDefault(item.popover.element, 100);
  }

  scrollTo(item: Story|Notification, cb: () => void) {

    const scroll = InteractiveHelpController.resolveScroll(item);

    if (scroll.type === 'scroll-none') {
      cb();
      return;
    }

    const scrollToElementPositioning = elementPositioning(scroll.element())!;
    const defaultScrollWithElement = jQuery('html, body');

    const calculatePopoverOffsetOnTopOfScrollToElement = (story: Story) => {

      const popoverDimension = this.getPopoverDimensions();

      switch (story.popover.position) {
        case 'left-up':
        case 'right-up':
          return Math.min(0, popoverDimension.height + arrowHeight - scrollToElementPositioning.height);
        case 'top-right':
        case 'top-left':
          return popoverDimension.height + arrowHeight;
        case 'left-down':
        case 'right-down':
        case 'bottom-right':
        case 'bottom-left':
          return 0;
        default:
          return assertNever(story.popover.position, 'Unsupported popover position');
      }
    };

    const resolveScrollWithElement = () => {

      switch (scroll.type) {
        case 'scroll-with-element':
          return scroll.scrollElement();
        case 'scroll-with-default':
          const topModal = this.$uibModalStack.getTop();
          return topModal ? topModal.value.modalDomEl.find('.modal-content') : defaultScrollWithElement;
        default:
          assertNever(scroll, 'Unsupported popover scroll type');
      }
    };

    const scrollWithElement = resolveScrollWithElement();
    const scrollOffsetFromTop = scroll.offsetFromTop || 0;

    let scrollTop = scrollToElementPositioning.top - scrollOffsetFromTop;

    if (scrollWithElement !== defaultScrollWithElement) {

      const scrollWithElementOffsetFromTop = scrollWithElement.offset().top;
      const scrollWithElementScrollingPosition = scrollWithElement.scrollTop();

      scrollTop = scrollTop - scrollWithElementOffsetFromTop + scrollWithElementScrollingPosition;
    }

    if (item.type === 'story') {
      const popoverOffsetFromTop = calculatePopoverOffsetOnTopOfScrollToElement(item);

      if (popoverOffsetFromTop > scrollOffsetFromTop) {
        scrollTop -= popoverOffsetFromTop - scrollOffsetFromTop;
      }
    }

    if (!isNumberInMargin(10, this.currentScrollTop, scrollTop)) {
      const duration = 100;
      scrollWithElement.stop(); // stop previous animation
      scrollWithElement.animate({ scrollTop }, duration, cb);
    } else {
      cb();
    }

    this.currentScrollTop = scrollTop;
  }


  keyDownHandler(event: JQueryEventObject) {

    if (!this.item) {
      stopEvent(event);
    }

    const moveToPreviousIfPossible = () => {
      if (this.canMoveToPrevious()) {
        this.$scope.$apply(() => this.moveToPreviousItem());
      }
    };

    const moveToNextIfPossible = () => {
      if (this.canMoveToNext()) {
        this.$scope.$apply(() => this.tryToMoveToNextItem());
      }
    };

    const loadFocusableElementList = (item: Story|Notification): Optional<HTMLElement[]> => {

      if (item.type === 'notification' || item.denyInteraction) {
        return [];
      } else if (!item.focus) {
        return null;
      }

      const focusableElements = item.focus.element().find(focusableSelector).addBack(focusableSelector);
      const result: HTMLElement[] = [];

      focusableElements.each((_index: number, element: HTMLElement) => {
        if (isVisible(element) && (!element.tabIndex || element.tabIndex > 0)) {
          result.push(element);
        }
      });

      return result;
    };

    const manageTabKeyFocus = (item: Story|Notification) => {

      const focusableElements = loadFocusableElementList(item);

      const activeElementIsFocusable = () => {
        for (const focusableElement of focusableElements || []) {
          if (focusableElement === document.activeElement) {
            return true;
          }
        }
        return false;
      };

      if (focusableElements) {
        if (focusableElements.length > 0) {

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) {
            if (isFocusInElement(event, firstElement)) {
              moveToPreviousIfPossible();
              stopEvent(event);
            }
          } else {
            if (isFocusInElement(event, lastElement)) {
              moveToNextIfPossible();
              stopEvent(event);
            }
          }

          // prevent input focus breaking from item focusable area
          if (!activeElementIsFocusable()) {
            firstElement.focus();
            stopEvent(event);
          }

        } else {
          if (event.shiftKey) {
            moveToPreviousIfPossible();
          } else {
            moveToNextIfPossible();
          }
          stopEvent(event);
        }
      } else {
        // free focus, don't stop event
      }
    };


    switch (event.which) {
      case tab:
        manageTabKeyFocus(this.item!);
        break;
      case enter:
        moveToNextIfPossible();
        stopEvent(event);
        break;
      case esc:
        this.$scope.$apply(() => this.close(true));
        break;
    }
  }

  moveToNextItemAfterElementDisappeared(element: () => JQuery) {

    let tryCount = 0;

    const waitForElementToDisappear = () => {

      if (elementExists(element())) {
        if (++tryCount < 100) {
          setTimeout(waitForElementToDisappear, 10);
        }
      } else {
        this.$scope.$apply(() => this.moveToNextItem());
      }
    };

    waitForElementToDisappear();
  }

  clickHandler(event: JQueryEventObject) {

    const markLocationChange = () => {
      this.changingLocation = true;
      setTimeout(() => this.changingLocation = false, 3000);
    };

    const item = this.item;

    if (item && item.type === 'story' && isClick(item.nextCondition) && this.isValid()) {
      const continueToNextElement = item.nextCondition.element();

      if (elementExists(continueToNextElement)) {
        if (isTargetElementInsideElement(event, continueToNextElement[0])) {
          if (item.nextCondition.type === 'modifying-click') {
            this.moveToNextItemAfterElementDisappeared(item.nextCondition.element);
          } else if (item.nextCondition.type === 'navigating-click') {
            markLocationChange();
          } else {
            this.$scope.$apply(() => this.moveToNextItem());
          }
        }
      } else if (item.nextCondition.type === 'modifying-click') {
        this.$scope.$apply(() => this.moveToNextItem());
      } else if (item.nextCondition.type === 'navigating-click') {
        markLocationChange();
      } else {
        console.log(this.item);
        throw new Error('Next condition element not found');
      }
    }
  }

  getPopoverDimensions() {
    if (!this.popoverDimensionsProvider) {
      return { width: 0, height: 0 };
    }
    return this.popoverDimensionsProvider.getDimensions();
  }

  registerPopover(popover: InteractiveHelpPopoverComponent) {
    this.popoverController = popover;
  }

  registerPopoverDimensionsProvider(provider: PopoverDimensionsProvider) {
    this.popoverDimensionsProvider = provider;
  }

  registerBackdrop(backdrop: InteractiveHelpBackdropComponent) {

    this.backdropController = backdrop;

    if (!this.item) {
      this.backdropController.setFullBackdrop();
    }
  }

  canMoveToNext() {
    return !this.inTransition && this.isValid();
  }

  canMoveToPrevious() {

    const previous = this.peekPrevious();

    function isImplicitlyReversible(condition: NextCondition) {
      switch (condition.type) {
        case 'explicit':
          return true;
        case 'click':
        case 'modifying-click':
        case 'navigating-click':
        case 'expected-state':
          return false;
        default:
          return assertNever(condition, 'Unsupported next condition');
      }
    }

    function isReversible(item: Story|Notification) {
      if (item.type === 'notification') {
        return true;
      } else if (item.reversible) {
        return item.reversible;
      } else {
        return isImplicitlyReversible(item.nextCondition);
      }
    }

    return !this.inTransition && !!previous && isReversible(previous);
  }

  get showNext() {
    return !!this.item && !this.isCurrentLastItem() && (this.item.type === 'notification' || !isClick(this.item.nextCondition) || !this.item.nextCondition.ambiguous);
  }

  get showClose() {
    return !!this.item && this.isCurrentLastItem() && (this.item.type === 'notification' || !isClick(this.item.nextCondition) || !this.item.nextCondition.ambiguous);
  }

  get showPrevious() {
    return !this.isCurrentFirstItem();
  }

  peekPrevious(): Optional<Story|Notification> {
    if (this.isCurrentFirstItem()) {
      return null;
    } else {
      return this.items[this.activeIndex - 1];
    }
  }

  isValid() {

    if (!this.item) {
      return false;
    }

    switch (this.item.type) {
      case 'story':
        switch (this.item.nextCondition.type) {
          case 'explicit':
          case 'click':
          case 'navigating-click':
          case 'modifying-click':
            return true;
          case 'expected-state':
            return this.item.nextCondition.valid();
          default:
            return assertNever(this.item.nextCondition, 'Unknown next condition');
        }
      case 'notification':
        return true;
      default:
        return assertNever(this.item, 'Unknown item type');
    }
  }

  tryToMoveToNextItem() {

    const item = requireDefined(this.item);

    if (item.type === 'notification') {
      this.moveToNextItem();
    } else {

      const nextCondition = item.nextCondition;

      if (isClick(nextCondition)) {
        if (!nextCondition.ambiguous) {
          // off frame so multiple digests are prevented
          setTimeout(() => nextCondition.element().click());
        }
      } else {
        this.moveToNextItem();
      }
    }
  }

  moveToNextItem() {
    if (this.isCurrentLastItem()) {
      this.close(false);
    } else {
      this.showItem(++this.activeIndex);
    }
  }

  moveToPreviousItem() {
    if (this.isCurrentFirstItem()) {
      this.close(true);
    } else {
      this.showItem(--this.activeIndex);
    }
  }

  isCurrentFirstItem() {
    return this.activeIndex === 0;
  }

  isCurrentLastItem() {
    return this.activeIndex === this.items.length - 1;
  }

  close(cancel: boolean) {
    this.$overlayInstance.close();

    if (cancel) {
      if (this.help.onCancel) {
        this.help.onCancel();
      }
    } else {
      if (this.help.onComplete) {
        this.help.onComplete();
      }
    }
  }
}
