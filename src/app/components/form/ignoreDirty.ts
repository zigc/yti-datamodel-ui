import { IAttributes, INgModelController, IScope } from 'angular';
import { DirectiveDeclaration } from 'app/utils/angular';

export const IgnoreDirtyDirective: DirectiveDeclaration = {
  selector: 'ignoreDirty',
  factory() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, modelController: INgModelController) {
        modelController.$setPristine = () => {};
        modelController.$pristine = false;
      }
    };
  }
};
