import { IAttributes, INgModelController, IScope } from 'angular';
import { isDefined } from 'yti-common-ui/utils/object';
import { DirectiveDeclaration } from 'app/utils/angular';

interface MaxInputScope extends IScope {
  min: number;
}

export const MaxInputDirective: DirectiveDeclaration = {
  selector: 'maxInput',
  factory() {
    return {
      scope: {
        min: '='
      },
      restrict: 'A',
      require: 'ngModel',
      link($scope: MaxInputScope, _element: JQuery, _attributes: IAttributes, modelController: INgModelController) {

        $scope.$watch(() => $scope.min, () => modelController.$validate());

        modelController.$validators['negative'] = (value: number) => {
          return !isDefined(value) || value >= 0;
        };
        modelController.$validators['lessThanMin'] = (value: number) => {
          return !isDefined(value) || !isDefined($scope.min) || value >= $scope.min;
        };
      }
    };
  }
};
