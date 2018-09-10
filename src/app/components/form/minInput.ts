import { IAttributes, INgModelController, IScope } from 'angular';
import { isDefined } from 'yti-common-ui/utils/object';
import { DirectiveDeclaration } from 'app/utils/angular';

interface MinInputScope extends IScope {
  max: number;
}

export const MinInputDirective: DirectiveDeclaration = {
  selector: 'minInput',
  factory() {
    return {
      scope: {
        max: '='
      },
      restrict: 'A',
      require: 'ngModel',
      link($scope: MinInputScope, _element: JQuery, _attributes: IAttributes, modelController: INgModelController) {

        $scope.$watch(() => $scope.max, () => modelController.$validate());

        modelController.$validators['negative'] = (value: number) => {
          return !isDefined(value) || value >= 0;
        };

        modelController.$validators['greaterThanMax'] = (value: number) => {
          return !isDefined(value) || !isDefined($scope.max) || value <= $scope.max;
        };
      }
    };
  }
};
