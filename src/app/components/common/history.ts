import { HistoryModal } from './historyModal';
import { Model } from 'app/entities/model';
import { Class } from 'app/entities/class';
import { Predicate } from 'app/entities/predicate';
import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const HistoryComponent: ComponentDeclaration = {
  selector: 'history',
  bindings: {
    model: '=',
    resource: '='
  },
  template: `
      <button type="button" class="btn btn-secondary-action pull-right" ng-click="$ctrl.openHistory()">
        <span translate>Show history</span>
      </button>
  `,
  controller: forwardRef(() => HistoryController)
};

class HistoryController {

  model: Model;
  resource: Class|Predicate|Model;

  constructor(private historyModal: HistoryModal) {
    'ngInject';
  }

  openHistory() {
    this.historyModal.open(this.model, this.resource);
  }
}
