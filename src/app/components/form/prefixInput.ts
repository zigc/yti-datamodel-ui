import { IAttributes, INgModelController, IScope } from 'angular';
import { isValidPrefix, isValidPrefixLength } from './validators';
import { ImportedNamespace, Model, NamespaceType } from 'app/entities/model';
import { DirectiveDeclaration } from 'app/utils/angular';

interface PrefixInputScope extends IScope {
  model: Model;
  activeNamespace: ImportedNamespace;
  allowTechnical: boolean;
}

export const PrefixInputDirective: DirectiveDeclaration = {
  selector: 'prefixInput',
  factory() {
    return {
      scope: {
        model: '=?',
        activeNamespace: '=?',
        allowTechnical: '=?'
      },
      restrict: 'A',
      require: 'ngModel',
      link($scope: PrefixInputScope, _element: JQuery, _attributes: IAttributes, ngModel: INgModelController) {
        ngModel.$validators['prefix'] = isValidPrefix;
        ngModel.$validators['length'] = isValidPrefixLength;
        ngModel.$validators['existingId'] = (prefix: string) => {

          const model = $scope.model;
          const activeNamespace = $scope.activeNamespace;
          const allowTechnical = $scope.allowTechnical;

          if (!model) {
            return true;
          } else {
            for (const modelNamespace of model.getNamespaces()) {
              if (modelNamespace.prefix === prefix) {

                const isTechnical = modelNamespace.namespaceType === NamespaceType.IMPLICIT_TECHNICAL;
                const isActiveNamespace = activeNamespace ? activeNamespace.prefix === modelNamespace.prefix : false;

                if (isTechnical && allowTechnical) {
                  return true;
                } else {
                  return isActiveNamespace;
                }
              }
            }
            return true;
          }
        };
      }
    };
  }
};
