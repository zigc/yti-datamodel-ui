import { module as mod } from './module';
import { Show } from 'app/types/component';
import { IScope, IAttributes } from 'angular';
import { FloatController } from 'app/components/common/float';
import { assertNever } from 'yti-common-ui/utils/object';
import { Class } from 'app/entities/class';
import { Predicate } from 'app/entities/predicate';
import { Model } from 'app/entities/model';
import { ModelPageActions } from 'app/components/model/modelPage';

mod.directive('visualizationView', () => {
  return {
    scope: {
      selection: '=',
      model: '=',
      show: '=',
      modelPageActions: '=',
      selectionWidth: '='
    },
    restrict: 'E',
    template: require('./visualizationView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['visualizationView', '?float'],
    link($scope: IScope, element: JQuery, _attributes: IAttributes, [thisController, floatController]: [VisualizationViewController, FloatController]) {

      $scope.$watchGroup([() => thisController.selectionWidth, () => thisController.show, () => floatController && floatController.floating],
        ([selectionWidth, show, floating]: [number, Show, boolean]) => {

        const width = show === Show.Both ? `calc(100% - ${selectionWidth + 10 + (floating ? 295 : 0)}px)` : '100%';

        element.css({
          'padding-left': show === Show.Visualization ? '5px' : 0,
          width: width
        });

        if (floatController) {
          floatController.setWidth(width);

          switch (show) {
            case Show.Both:
              floatController.enableFloating();
              element.removeClass('hide');
              break;
            case Show.Visualization:
              floatController.disableFloating();
              element.removeClass('hide');
              break;
            case Show.Selection:
              floatController.disableFloating();
              element.addClass('hide');
              break;
            default:
              assertNever(show, 'Unsupported show: ' + show);
          }
        }
      });
    },
    controller: VisualizationViewController
  };
});

export class VisualizationViewController {

  selection: Class|Predicate;
  model: Model;
  show: Show;
  selectionWidth: number;
  modelPageActions: ModelPageActions;

  enlargeVisualization() {
    this.show++;
  }

  shrinkVisualization() {
    this.show--;
  }
}
