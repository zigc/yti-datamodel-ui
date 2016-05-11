import { DefinedBy, Destination, Model } from '../../services/entities';
import { normalizeModelType } from '../../utils/type';
import { module as mod } from './module';

mod.directive('definedBy', () => {
  return {
    restrict: 'E',
    template: require('./definedBy.html'),
    scope: {
      entity: '=',
      model: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    controller: DefinedByController
  };
});

interface Entity extends Destination {
  definedBy: DefinedBy;
}

class DefinedByController {

  entity: Entity;
  model: Model;

  get definedByTitle() {
    const type = normalizeModelType(this.entity && this.entity.definedBy && this.entity.definedBy.type || []);
    return 'Defined by' + (type ? ' ' + type : '');
  }
}
