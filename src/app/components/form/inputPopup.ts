import { IAttributes, IDirectiveFactory, IRepeatScope, IScope, ITranscludeFunction, IWindowService } from 'angular';
import { hasFixedPositioningParent, LegacyComponent, scrollToElement } from 'app/utils/angular';
import { NgZone } from '@angular/core';

export interface InputWithPopupController<T> {
  popupItemName: string;
  show: boolean;
  popupItems: T[];
  selectedSelectionIndex: number;
  element: JQuery;
  isSelected(index: number): boolean;
  setSelection(index: number): void;
  selectSelection(event?: JQueryEventObject): void;
}

interface InputPopupScope extends IScope {
  $ctrl: InputPopupComponent<any>;
}

@LegacyComponent({
  transclude: true,
  bindings: {
    ctrl: '<',
    idPrefix: '<'
  },
  template: `
        <div ng-if-body="$ctrl.ctrl.show" class="input-popup show">
          <ul class="dropdown-menu" ng-style="$ctrl.popupStyle">
            <a ng-repeat="item in $ctrl.ctrl.popupItems"
                ng-attr-id="{{$ctrl.id(item)}}"
                class="dropdown-item"
                ng-class="{ active: $ctrl.ctrl.isSelected($index) }" 
                ng-mouseenter="$ctrl.ctrl.setSelection($index)" 
                ng-mousedown="$ctrl.ctrl.selectSelection(event)"
                input-popup-select-item="$ctrl.ctrl">
              <input-popup-item-transclude></input-popup-item-transclude>
            </a>
          </ul>
        </div>
  `
})
export class InputPopupComponent<T> {

  ctrl: InputWithPopupController<T>;
  popupStyle: { top: string|number, left: string|number, width: string|number, position: string };
  idPrefix?: string;

  private idCleanerExpression = /[^a-zA-Z0-9_-]/g;

  constructor(private $scope: InputPopupScope,
              private $window: IWindowService,
              private zone: NgZone) {
    'ngInject';
  }

  $onInit() {

    const calculatePopupStyle = (e: JQuery) => {
      const offset = e.offset();
      const fixed = hasFixedPositioningParent(e);
      return {
        position: fixed ? 'fixed' : 'absolute',
        top: offset.top + e.prop('offsetHeight') - (fixed ? window.pageYOffset : 0),
        left: offset.left,
        width: e.prop('offsetWidth')
      };
    };

    this.$scope.$watch(() => this.ctrl.show, () => this.popupStyle = calculatePopupStyle(this.ctrl.element));

    this.$scope.$watch(() => {
      const offset = this.ctrl.element.offset();
      return {
        left: offset.left,
        top: offset.top
      };
    }, () => this.popupStyle = calculatePopupStyle(this.ctrl.element), true);

    const setPopupStyleToElement = () => {
      if (this.ctrl.show) {
        this.popupStyle = calculatePopupStyle(this.ctrl.element);
        // apply styles without invoking scope for performance reasons
        jQuery('div.input-popup .dropdown-menu').css(this.popupStyle);
      }
    };

    this.zone.runOutsideAngular(() => {
      window.addEventListener('resize', setPopupStyleToElement);
    });

    this.$scope.$on('$destroy', () => {
      window.removeEventListener('resize', setPopupStyleToElement);
    });
  }

  id(item: any): string | undefined {
    if (item && this.idPrefix) {
      if (typeof item === 'string') {
        return this.idPrefix + '_' + this.cleanIdPart(item);
      } else if (item.id && typeof item.id === 'string') {
        return this.idPrefix + '_' + this.cleanIdPart(item.id);
      }
    }
    return undefined;
  }

  private cleanIdPart(value: string): string {
    return value.replace(this.idCleanerExpression, '_');
  }

  /*
  // Testing to make robot usage easier
  onClick(index: number, event?: JQueryEventObject) {
    this.ctrl.setSelection(index);
    this.ctrl.selectSelection(event);
  }
  */
}

interface SelectItemScope extends IRepeatScope, InputPopupScope {
  item: any;
}

export const InputPopupItemTranscludeDirective: IDirectiveFactory = () =>  {
  return {
    link($scope: SelectItemScope, element: JQuery, _attribute: IAttributes, _controller: any, transclude: ITranscludeFunction) {
      transclude((clone, transclusionScope) => {
        (transclusionScope as any)[$scope.$ctrl.ctrl.popupItemName] = $scope.item;
        element.append(clone!);
      });
    }
  };
};

interface InputPopupItemScope extends IRepeatScope {
  inputPopupSelectItem: InputWithPopupController<any>;
}

export const InputPopupSelectItemDirective: IDirectiveFactory = () => {
  return {
    restrict: 'A',
    scope: {
      inputPopupSelectItem: '='
    },
    link($scope: InputPopupItemScope, element: JQuery) {
      $scope.$watch(() => $scope.inputPopupSelectItem && $scope.inputPopupSelectItem.selectedSelectionIndex, index => {
        if (($scope.$parent as IRepeatScope).$index === index) {
          scrollToElement(element, element.parent());
        }
      });
    }
  };
};
