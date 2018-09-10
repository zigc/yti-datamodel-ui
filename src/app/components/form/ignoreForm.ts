import { IAttributes, IFormController, INgModelController, IScope } from 'angular';
import { DirectiveDeclaration } from 'app/utils/angular';

export const IgnoreFormDirective: DirectiveDeclaration = {
  selector: 'ignoreForm',
  factory() {
    return {
      restrict: 'A',
      require: ['ngModel', '^?form'],
      link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [modelController, formController]: [INgModelController, IFormController]) {
        if (formController) {
          formController.$removeControl(modelController);
        }
      }
    };
  }
};
