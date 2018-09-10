import { IRepeatScope, IScope, ITimeoutService } from 'angular';
import { arrowDown, arrowUp, enter, pageDown, pageUp } from 'yti-common-ui/utils/key-code';
import { DirectiveDeclaration, scrollToElement } from 'app/utils/angular';

export const KeyControlDirective: DirectiveDeclaration = {
  selector: 'keyControl',
  factory() {
    return {
      restrict: 'A',
      controller: KeyControlController
    };
  }
};

export class KeyControlController {

  itemCount = 0;
  selectionIndex = -1;

  private keyEventHandlers: {[key: number]: () => void} = {
    [arrowDown]: () => this.moveSelection(1),
    [arrowUp]: () => this.moveSelection(-1),
    [pageDown]: () => this.moveSelection(10),
    [pageUp]: () => this.moveSelection(-10),
    [enter]: () => this.selectSelection()
  };

  /* @ngInject */
  constructor(private $scope: IScope,
              private $element: JQuery) {
  }

  $postLink() {
    this.$element.on('keydown', event => this.keyPressed(event));
    this.$scope.$watch(this.$element.attr('key-control') + '.length', (items: number) => this.onItemsChange(items || 0));
  }

  onItemsChange(itemCount: number) {
    this.itemCount = itemCount;
    this.setSelection(-1);
  }

  keyPressed(event: JQueryEventObject) {
    const handler = this.keyEventHandlers[event.keyCode];
    if (handler) {
      event.preventDefault();
      handler();
    }
  }

  private moveSelection(offset: number) {
    this.setSelection(Math.max(Math.min(this.selectionIndex + offset, this.itemCount - 1), -1));
  }

  private setSelection(index: number) {
    this.selectionIndex = index;
    this.$scope.$parent.$broadcast('selectionMoved', this.selectionIndex);
  }

  private selectSelection() {
    this.$scope.$parent.$broadcast('selectionSelected', this.selectionIndex);
  }
}

const selectionClass = 'active';

export const KeyControlSelectionDirective: DirectiveDeclaration = {
  selector: 'keyControlSelection',
  factory() {
    return {
      restrict: 'A',
      controller: KeyControlSelectionController
    }
  }
};

class KeyControlSelectionController {

  /* @ngInject */
  constructor(private $scope: IRepeatScope,
              private $element: JQuery,
              private $timeout: ITimeoutService) {
  }

  $postLink() {

    this.$scope.$on('selectionMoved', (_event, selectionIndex) => this.update(selectionIndex));
    this.$scope.$on('selectionSelected', (_event, selectionIndex) => {
      if (selectionIndex === this.$scope.$index) {
        // do outside of digest cycle
        this.$timeout(() => this.$element.click());
      }
    });
  }

  update(selectionIndex: number) {
    if (this.$scope.$index === selectionIndex) {
      this.$element.addClass(selectionClass);
      scrollToElement(this.$element, this.findParent());
    } else {
      this.$element.removeClass(selectionClass);
    }
  }

  findParent() {
    const parent = this.$element.parent();
    if (parent.is('search-results')) {
      return parent.parent();
    } else {
      return parent;
    }
  }
}
