import { IAttributes, INgModelController, IScope } from 'angular';
import { DirectiveDeclaration } from 'app/utils/angular';

export const BootstrapInputDirective: DirectiveDeclaration = {
  selector: 'input',
  factory() {
    return {
      restrict: 'E',
      require: '?ngModel',
      link($scope: IScope, element: JQuery, _attributes: IAttributes, modelController: INgModelController) {

        function setClasses(invalid: boolean) {
          if ((modelController.$dirty || modelController.$viewValue) && invalid) {
            element.addClass('is-invalid');
          } else {
            element.removeClass('is-invalid');
          }
        }

        if (modelController) {
          $scope.$watch(() => modelController.$invalid, setClasses);
          $scope.$watch(() => modelController.$dirty, () => setClasses(modelController.$invalid));
        }
      }
    };
  }
};
