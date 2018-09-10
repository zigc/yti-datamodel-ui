import { EditableEntityController, EditableForm } from './editableEntityController';
import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const EditableEntityButtons: ComponentDeclaration = {
  selector: 'editableEntityButtons',
  bindings: {
    ctrl: '=editableController',
    context: '='
  },
  require: {
    form: '^form'
  },
  transclude: true,
  template: require('./editableEntityButtons.html'),
  controller: forwardRef(() => EditableEntityButtonsController)
};

class EditableEntityButtonsController {

  ctrl: EditableEntityController<any>;
  form: EditableForm;
}
