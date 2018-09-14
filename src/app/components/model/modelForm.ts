import { Model } from 'app/entities/model';
import { ModelControllerService } from './modelControllerService';
import { LegacyComponent } from 'app/utils/angular';
import { EditableForm } from 'app/components/form/editableEntityController';

@LegacyComponent({
  bindings: {
    id: '=',
    model: '=',
    modelController: '='
  },
  require: {
    form: '?^form'
  },
  template: require('./modelForm.html')
})
export class ModelFormComponent {

  model: Model;
  modelController: ModelControllerService;

  form: EditableForm;

  isEditing() {
    return this.form && this.form.editing;
  }

  get allowProfiles() {
    return this.model.isOfType('profile');
  }

  namespacesInUse() {
    return this.modelController && this.modelController.namespacesInUse;
  }
}
