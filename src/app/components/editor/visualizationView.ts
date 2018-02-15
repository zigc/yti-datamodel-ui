import { module as mod } from './module';
import { Class } from 'app/entities/class';
import { Predicate } from 'app/entities/predicate';
import { Model } from 'app/entities/model';

mod.directive('visualizationView', () => {
  return {
    scope: {
      selection: '=',
      model: '=',
      modelPageActions: '=',
      maximized: '='
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
  maximized: boolean;
}
