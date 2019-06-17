import { IAttributes, IDirectiveFactory, INgModelController, IScope } from 'angular';
import { isValidPrefix, isValidPrefixLength } from './validators';
import { ImportedNamespace, Model, NamespaceType } from 'app/entities/model';

interface PrefixInputScope extends IScope {
  model: Model;
  activeNamespace: ImportedNamespace;
  allowTechnical: boolean;
  reservedPrefixes?: string[];
  reservedPrefixesGetter?: () => string[];
}

export const PrefixInputDirective: IDirectiveFactory = () => {
  return {
    scope: {
      model: '=?',
      activeNamespace: '=?',
      allowTechnical: '=?',
      reservedPrefixes: '=?',
      reservedPrefixesGetter: '=?'
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: PrefixInputScope, _element: JQuery, _attributes: IAttributes, ngModel: INgModelController) {
      ngModel.$validators['prefix'] = isValidPrefix;
      ngModel.$validators['length'] = isValidPrefixLength;
      ngModel.$validators['existingOrReservedId'] = (prefix: string) => {

        const model = $scope.model;
        const activeNamespace = $scope.activeNamespace;
        const allowTechnical = $scope.allowTechnical;
        const reservedPrefixes: string[] = $scope.reservedPrefixes || ($scope.reservedPrefixesGetter ? $scope.reservedPrefixesGetter() : []);

        if (reservedPrefixes.includes(prefix)) {
          return false;
        }

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
};
