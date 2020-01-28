import { Model } from 'app/entities/model';
import { LegacyComponent } from 'app/utils/angular';
import { EditableForm } from 'app/components/form/editableEntityController';

@LegacyComponent({
  bindings: {
    id: '=',
    model: '=',
    namespacesInUse: '<',
    statusChanged: '=',
    changeResourceStatusesToo: '='
  },
  require: {
    form: '?^form'
  },
  template: require('./modelForm.html')
})
export class ModelFormComponent {

  model: Model;
  namespacesInUse?: Set<string>;
  form: EditableForm;
  statusChanged: boolean;
  changeResourceStatusesToo: boolean;

  get allowProfiles() {
    return this.model.isOfType('profile');
  }

  get previousModelLink() {
    return this.model.previousModel ? this.model.previousModel.uri : null;
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  showChangeResourceStatusesCheckbox(): boolean {
    return this.form.editing && this.statusChanged;
  }
}
