import { IAttributes, IScope } from 'angular';
import { module as mod } from './module';
import { EditableForm } from './editableEntityController';
import { Model } from 'app/entities/model';
import { AuthorizationManagerService } from 'app/services/authorizationManagerService';
import { Status } from 'yti-common-ui/entities/status';

mod.directive('editableStateSelect', () => {
  return {
    scope: {
      state: '=',
      model: '=',
      id: '@'
    },
    restrict: 'E',
    template: `
      <div>
        <iow-select ng-if="ctrl.isEditing()" id="{{ctrl.id}}" options="state in ctrl.getStates()" ng-model="ctrl.state">
          <i ng-class="ctrl.classForState(state)"></i>
          <span>{{state | translate}}</span>
        </iow-select>

        <div class="non-editable" ng-if="!ctrl.isEditing()">
          <i ng-class="ctrl.classForState(ctrl.state)"></i>
          <span>{{ctrl.state | translate}}</span>
        </div>
      </div>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['editableStateSelect', '?^form'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [thisController, editableController]: [StateSelectController, EditableForm]) {
      thisController.isEditing = () => editableController && editableController.editing;
    },
    controller: StateSelectController
  };
});

class StateSelectController {

  model: Model;
  state: Status;
  id: string;
  isEditing: () => boolean;

  /* @ngInject */
  constructor(private authorizationManagerService: AuthorizationManagerService) {
  }

  getStates() {
    return this.authorizationManagerService.getAllowedStatuses(this.model);
  }

  classForState(state: Status) {
    return [];
  }
}
