import { IAttributes, IDirectiveFactory, IFormController, INgModelController, IScope } from 'angular';

export const IgnoreFormDirective: IDirectiveFactory = () => {
  return {
    restrict: 'A',
    require: ['ngModel', '^?form'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [modelController, formController]: [INgModelController, IFormController]) {
      if (formController) {
        formController.$removeControl(modelController);
      }
    }
  };
};
