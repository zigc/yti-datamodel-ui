import { IAttributes, IDirectiveFactory, INgModelController, IScope } from 'angular';

export const BootstrapInputDirective: IDirectiveFactory = () => {
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
};
