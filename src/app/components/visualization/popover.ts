import { module as mod } from './module';
import { IScope, IAttributes, ITimeoutService } from 'angular';
import { hasLocalization } from 'app/utils/language';
import { Coordinate, Dimensions } from 'app/types/visualization';
import { Localizable } from 'yti-common-ui/types/localization';
import { LanguageContext } from 'app/types/language';

export interface VisualizationPopoverDetails {
  coordinate: Coordinate;
  heading: Localizable;
  comment: Localizable;
}

mod.directive('visualizationPopover', () => {
  return {
    scope: {
      details: '=',
      context: '='
    },
    restrict: 'E',
    bindToController: true,
    controllerAs: 'ctrl',
    controller: VisualizationPopoverController,
    template: `
       <div class="popover fade show bs-popover-left" ng-style="ctrl.style">
         <div class="arrow" ng-style="{ top: ctrl.arrowTopOffset }"></div>
         <div class="popover-header">
           <h4 class="mb-0">{{ctrl.details.heading | translateValue: ctrl.context}}</h4>
         </div>
         <div class="popover-body">
           {{ctrl.details.comment | translateValue: ctrl.context}}
         </div>
       </div>
    `,
    require: 'visualizationPopover',
    link(_$scope: IScope, element: JQuery, _attributes: IAttributes, ctrl: VisualizationPopoverController) {

      const classVisualizationElement = element.closest('class-visualization');
      const popoverElement = element.find('.popover');

      ctrl.visualizationOffset = () => ({
        x: classVisualizationElement.offset().left,
        y: classVisualizationElement.offset().top
      });

      ctrl.getDimensions = () => {
        return {
          width: popoverElement.outerWidth(),
          height: popoverElement.outerHeight()
        };
      };
    }
  };
});

class VisualizationPopoverController {
  details: VisualizationPopoverDetails;
  context: LanguageContext;

  getDimensions: () => Dimensions;
  style: any = {};
  visualizationOffset: () => Coordinate;

  constructor($scope: IScope, $timeout: ITimeoutService) {
    $scope.$watch(() => this.details, details => {
      // Hide by keeping off screen absolute position
      this.style = { top: -10000 + 'px',  left: -10000 + 'px' };

      if (details && hasLocalization(details.comment)) {
        this.style.comment = details.comment;

        // Let the comment render before accessing calculated dimensions
        $timeout(() => {
          const dimensions = this.getDimensions();
          const offset = this.visualizationOffset();
          this.style.top = (details.coordinate.y - offset.y - (dimensions.height / 2)) + 'px';
          this.style.left = (details.coordinate.x - offset.x - dimensions.width - 15) + 'px';
        });
      }
    });
  }

  get arrowTopOffset() {
    return this.getDimensions().height / 2;
  }
}
