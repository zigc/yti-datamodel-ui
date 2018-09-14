import { EditableEntityController, EditableForm } from './editableEntityController';
import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    ctrl: '=editableController',
    context: '='
  },
  require: {
    form: '^form'
  },
  transclude: true,
  template: require('./editableEntityButtons.html')
})
export class EditableEntityButtonsComponent {

  ctrl: EditableEntityController<any>;
  form: EditableForm;
}
