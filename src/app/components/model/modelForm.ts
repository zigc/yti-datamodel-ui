import { Model } from 'app/entities/model';
import { ModelControllerService } from './modelControllerService';
 import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';
import { EditableForm } from 'app/components/form/editableEntityController';

export const ModelFormComponent: ComponentDeclaration = {
  selector: 'modelForm',
  bindings: {
    id: '=',
    model: '=',
    modelController: '='
  },
  require: {
    form: '?^form'
  },
  template: require('./modelForm.html'),
  controller: forwardRef(() => ModelFormController)
};

class ModelFormController {

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
