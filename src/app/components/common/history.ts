import { HistoryModal } from './historyModal';
import { Model } from 'app/entities/model';
import { Class } from 'app/entities/class';
import { Predicate } from 'app/entities/predicate';
import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    model: '=',
    resource: '='
  },
  template: `
      <div class="btn-secondary-action dropdown-item" ng-click="$ctrl.openHistory()">
        <span translate>Show history</span>
      </div>
  `
})
export class HistoryComponent {

  model: Model;
  resource: Class|Predicate|Model;

  constructor(private historyModal: HistoryModal) {
    'ngInject';
  }

  openHistory() {
    this.historyModal.open(this.model, this.resource);
  }
}
