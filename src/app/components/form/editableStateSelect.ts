import { EditableForm } from './editableEntityController';
import { Model } from 'app/entities/model';
import { AuthorizationManagerService } from 'app/services/authorizationManagerService';
import { Status } from 'yti-common-ui/entities/status';
 import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const EditableStateSelectComponent: ComponentDeclaration = {
  selector: 'editableStateSelect',
  bindings: {
    state: '=',
    model: '=',
    id: '@'
  },
  template: `
      <div class="form-group">
      
        <label translate>Status</label>
      
        <iow-select ng-if="$ctrl.isEditing()" id="{{$ctrl.id}}" options="state in $ctrl.getStates()" ng-model="$ctrl.state">
          <span>{{state | translate}}</span>
        </iow-select>

        <p ng-if="!$ctrl.isEditing()" class="form-control-static">{{$ctrl.state | translate}}</p>
      </div>
    `,
  require: {
    form: '?^form'
  },
  controller: forwardRef(() => EditableStateSelectController)
};

class EditableStateSelectController {

  model: Model;
  state: Status;
  id: string;

  form: EditableForm;

  /* @ngInject */
  constructor(private authorizationManagerService: AuthorizationManagerService) {
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  getStates() {
    return this.authorizationManagerService.getAllowedStatuses(this.model);
  }
}
