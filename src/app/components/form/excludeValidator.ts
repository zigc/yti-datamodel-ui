import { IAttributes, INgModelController, IPromise, IQService, IScope } from 'angular';
import { Uri } from 'app/entities/uri';
import { DirectiveDeclaration } from 'app/utils/angular';

interface ExcludeValidatorAttributes extends IAttributes {
  excludeValidator: string;
}

export const ExcludeValidatorDirective: DirectiveDeclaration = {
  selector: 'excludeValidator',
  /* @ngInject */
  factory($q: IQService) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link($scope: IScope, _element: JQuery, attributes: ExcludeValidatorAttributes, ngModel: INgModelController) {

        $scope.$watch(attributes.excludeValidator, (excludeProvider: () => (id: Uri) => IPromise<string>) => {
          if (excludeProvider) {
            const exclude = excludeProvider();
            // TODO show exclude based dynamic validation errors in the errorMessages panel
            ngModel.$asyncValidators['exclude'] = (id: Uri) => {
              return exclude(id).then(excludeReason => excludeReason ? $q.reject() : true);
            };
          } else {
            delete ngModel.$asyncValidators['exclude'];
          }
        });
      }
    };
  }
};
