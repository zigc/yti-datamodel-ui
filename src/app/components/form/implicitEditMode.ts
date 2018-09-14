import { IAttributes, IDirectiveFactory, IScope } from 'angular';
import { EditableForm } from './editableEntityController';

export const ImplicitEditModeDirective: IDirectiveFactory = () => {
  return {
    require: '^form',
    link($scope: IScope, element: JQuery, attributes: IAttributes, form: EditableForm) {
      form.editing = true;
    }
  }
};
