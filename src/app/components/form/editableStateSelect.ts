import { EditableForm } from './editableEntityController';
import { Model } from 'app/entities/model';
import { AuthorizationManagerService } from 'app/services/authorizationManagerService';
import { Status } from 'yti-common-ui/entities/status';
import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
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
  }
})
export class EditableStateSelectComponent {

  model: Model;
  state: Status;
  id: string;

  form: EditableForm;

  constructor(private authorizationManagerService: AuthorizationManagerService) {
    'ngInject';
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  getStates() {
    return this.authorizationManagerService.getAllowedStatuses(this.model);
  }
}
