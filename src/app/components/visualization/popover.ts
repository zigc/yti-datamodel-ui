import { IScope, ITimeoutService } from 'angular';
import { hasLocalization } from 'app/utils/language';
import { Coordinate } from 'app/types/visualization';
import { Localizable } from 'yti-common-ui/types/localization';
import { LanguageContext } from 'app/types/language';
import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export interface VisualizationPopoverDetails {
  coordinate: Coordinate;
  heading: Localizable;
  comment: Localizable;
}

export const VisualizationPopoverComponent: ComponentDeclaration = {
  selector: 'visualizationPopover',
  bindings: {
    details: '=',
    context: '='
  },
  template: `
       <div class="popover fade show bs-popover-left" ng-style="$ctrl.style">
         <div class="arrow" ng-style="{ top: $ctrl.arrowTopOffset }"></div>
         <div class="popover-header">
           <h4 class="mb-0">{{$ctrl.details.heading | translateValue: $ctrl.context}}</h4>
         </div>
         <div class="popover-body">
           {{$ctrl.details.comment | translateValue: $ctrl.context}}
         </div>
       </div>
  `,
  controller: forwardRef(() => VisualizationPopoverController)
};

class VisualizationPopoverController {
  details: VisualizationPopoverDetails;
  context: LanguageContext;

  style: any = {};

  /* @ngInject */
  constructor(private $scope: IScope,
              private $timeout: ITimeoutService,
              private $element: JQuery) {
  }

  $onInit() {
    this.$scope.$watch(() => this.details, details => {
      // Hide by keeping off screen absolute position
      this.style = { top: -10000 + 'px',  left: -10000 + 'px' };

      if (details && hasLocalization(details.comment)) {
        this.style.comment = details.comment;

        // Let the comment render before accessing calculated dimensions
        this.$timeout(() => {
          const dimensions = this.getDimensions();
          const offset = this.visualizationOffset();
          this.style.top = (details.coordinate.y - offset.y - (dimensions.height / 2)) + 'px';
          this.style.left = (details.coordinate.x - offset.x - dimensions.width - 15) + 'px';
        });
      }
    });
  }

  getDimensions() {

    const popoverElement = this.$element.find('.popover');

    return {
      width: popoverElement.outerWidth(),
      height: popoverElement.outerHeight()
    };
  }

  visualizationOffset() {

    const classVisualizationElement = this.$element.closest('class-visualization');

    return {
      x: classVisualizationElement.offset().left,
      y: classVisualizationElement.offset().top
    };
  }

  get arrowTopOffset() {
    return this.getDimensions().height / 2;
  }
}
