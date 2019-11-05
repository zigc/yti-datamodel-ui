import { IModelFormatter, INgModelController, IQService, IScope } from 'angular';
import { isDefined } from 'yti-common-ui/utils/object';
import { arrowDown, arrowUp, enter, esc, pageDown, pageUp, tab } from 'yti-common-ui/utils/key-code';
import { formatWithFormatters, LegacyComponent } from 'app/utils/angular';
import { DataSource } from './dataSource';
import { InputWithPopupController } from './inputPopup';
import { limit } from 'yti-common-ui/utils/array';

// TODO: similarities with iowSelect
@LegacyComponent({
  bindings: {
    datasource: '=',
    matcher: '=',
    formatter: '=',
    valueExtractor: '=',
    excludeProvider: '=?',
    maxMatches: '='
  },
  transclude: true,
  template: `
      <div style="position: relative;"><ajax-loading-indicator-small ng-if="$ctrl.pendingShow" class="autocomplete-pending-indicator"></ajax-loading-indicator-small></div>
      <ng-transclude></ng-transclude>
      <input-popup ctrl="$ctrl"><span class="content">{{::$ctrl.format(match)}}</span></input-popup>
  `
})
export class AutocompleteComponent<T> implements InputWithPopupController<T> {

  datasource: DataSource<T>;
  matcher: (search: string, item: T) => boolean;
  formatter: (item: T) => string;
  valueExtractor: (item: T) => any;
  excludeProvider?: () => (item: T) => string;

  inputFormatter: IModelFormatter | IModelFormatter[];
  applyValue: (value: string) => void;

  popupItems: T[] = [];
  selectedSelectionIndex = -1;

  popupItemName = 'match';
  element: JQuery;

  maxMatches: number;

  private pendingShow = false;

  private keyEventHandlers: { [key: number]: () => void | boolean } = {
    [arrowDown]: () => this.moveSelection(1),
    [arrowUp]: () => this.moveSelection(-1),
    [pageDown]: () => this.moveSelection(10),
    [pageUp]: () => this.moveSelection(-10),
    [enter]: () => this.selectSelection(),
    [tab]: () => this.selectSelection(),
    [esc]: () => this.clear()
  };

  constructor(private $scope: IScope,
              private $q: IQService,
              private $element: JQuery,
              private $document: JQuery) {
    'ngInject';
  }

  get show() {
    return this.popupItems.length > 0;
  }

  $postLink() {

    const inputElement = this.$element.find('input');
    const ngModel: INgModelController = inputElement.controller('ngModel');

    this.$scope.$watchCollection(() => ngModel.$formatters, formatters => this.inputFormatter = formatters);

    const keyDownHandler = (event: JQueryEventObject) => this.$scope.$apply(() => this.keyPressed(event));
    const focusHandler = () => {
      this.$document.on('click', blurClickHandler);
      this.$scope.$apply(() => this.autocomplete(ngModel.$viewValue));
    };
    const blurClickHandler = (event: JQueryEventObject) => {

      const autocomplete = jQuery(event.target).closest('autocomplete');

      if (autocomplete[0] !== this.$element[0]) {
        this.pendingShow = false;
        this.$scope.$apply(() => this.clear());
        this.$document.off('click', blurClickHandler);
      }
    };

    inputElement.on('keydown', keyDownHandler);
    inputElement.on('focus', focusHandler);

    this.$scope.$on('$destroy', () => {
      inputElement.off('keydown', keyDownHandler);
      inputElement.off('focus', focusHandler);
    });

    let ignoreNextViewChange = false;

    this.$scope.$watch(() => ngModel.$viewValue, viewValue => {
      if (ignoreNextViewChange) {
        ignoreNextViewChange = false;
      } else {
        // prevents initial triggering when user is not actually inputting anything
        if (inputElement.is(':focus')) {
          this.autocomplete(viewValue);
        }
      }
    });

    this.applyValue = (value: string) => {
      ignoreNextViewChange = ngModel.$viewValue !== value;
      ngModel.$setViewValue(value);
      ngModel.$render();
    };

    this.element = inputElement;
  }

  keyPressed(event: JQueryEventObject) {
    const handler = this.keyEventHandlers[event.keyCode];
    if (handler) {
      const preventDefault = handler();
      if (!isDefined(preventDefault) || preventDefault === true) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  setSelection(index: number) {
    this.selectedSelectionIndex = index;
  }

  isSelected(index: number) {
    return index === this.selectedSelectionIndex;
  }

  format(value: T): string {
    if (!this.formatter) {
      return this.formatValue(value);
    } else {
      return this.formatter(value);
    }
  }

  match(search: string, value: T): boolean {
    if (!this.matcher) {
      return this.format(value).toLowerCase().indexOf(search.toLowerCase()) !== -1;
    } else {
      return this.matcher(search, value);
    }
  }

  formatValue(value: T): string {
    return formatWithFormatters(this.extractValue(value), this.inputFormatter);
  }

  extractValue(value: T): any {
    if (this.valueExtractor) {
      return this.valueExtractor(value);
    } else {
      return value;
    }
  }

  autocomplete(search: string) {
    this.pendingShow = true;
    this.$q.when(this.datasource(search)).then(data => {
      if (this.pendingShow) {
        this.pendingShow = false;

        const exclude = this.excludeProvider && this.excludeProvider();
        const included = data.filter(item => !exclude || !exclude(item));

        if (search) {
          this.setMatches(included.filter(item => this.match(search, item)), true);
        } else {
          this.setMatches(included, false);
        }
      } else {
        this.clear();
      }
    });
  }

  clear() {
    this.setMatches([], false);
  }

  setMatches(dataMatches: T[], selectFirst: boolean) {
    this.selectedSelectionIndex = selectFirst ? 0 : -1;
    const maxMatches = this.maxMatches || 500;
    this.popupItems = maxMatches > 0 ? limit(dataMatches, maxMatches) : dataMatches;
  }

  selectSelection(): boolean {

    const value = this.selectedSelectionIndex >= 0 ? this.popupItems[this.selectedSelectionIndex] : null;

    if (value) {
      this.applyValue(this.formatValue(value));
    }

    this.clear();

    return !!value;
  }

  private moveSelection(offset: number) {
    this.setSelection(Math.max(Math.min(this.selectedSelectionIndex + offset, this.popupItems.length - 1), -1));
  }
}
