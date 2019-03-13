import { Model } from 'app/entities/model';
import { LegacyComponent } from 'app/utils/angular';
import { EditableForm } from 'app/components/form/editableEntityController';

@LegacyComponent({
  bindings: {
    id: '=',
    model: '=',
    namespacesInUse: '<'
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

  get allowProfiles() {
    return this.model.isOfType('profile');
  }

  isEditing() {
    return this.form && this.form.editing;
  }
}
