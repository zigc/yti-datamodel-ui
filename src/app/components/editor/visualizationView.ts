import { module as mod } from './module';
import { Show } from 'app/types/component';
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
      modelPageActions: '='
    },
    restrict: 'E',
    template: require('./visualizationView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
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
