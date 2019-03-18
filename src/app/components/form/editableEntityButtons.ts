import { EditableEntityController, EditableForm } from './editableEntityController';
import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    ctrl: '=editableController',
    context: '=',
    idPrefix: '<'
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
  idPrefix?: string;

  id(button: string): string | undefined {
    return this.idPrefix ? this.idPrefix + button : undefined;
  }
}
