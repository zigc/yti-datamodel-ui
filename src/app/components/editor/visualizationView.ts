import { Class } from 'app/entities/class';
import { Predicate } from 'app/entities/predicate';
import { Model } from 'app/entities/model';
import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    selection: '=',
    model: '=',
    modelPageActions: '=',
    maximized: '='
  },
  template: require('./visualizationView.html')
})
export class VisualizationViewComponent {

  selection: Class|Predicate;
  model: Model;
  maximized: boolean;
}
