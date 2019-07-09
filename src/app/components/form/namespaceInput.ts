import { IAttributes, IDirectiveFactory, INgModelController, IScope } from 'angular';
import { isValidNamespaceUrlOrUrn } from './validators';
import { ImportedNamespace, Model, NamespaceType } from '../../entities/model';

interface NamespaceInputScope extends IScope {
  model: Model;
  activeNamespace: ImportedNamespace;
  allowTechnical: boolean;
  usedNamespaces?: string[];
}

export const NamespaceInputDirective: IDirectiveFactory = () => {
  return {
    scope: {
      model: '=?',
      activeNamespace: '=?',
      allowTechnical: '=?',
      usedNamespaces: '=?'
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: NamespaceInputScope, _element: JQuery, _attributes: IAttributes, ngModel: INgModelController) {

      ngModel.$validators['namespaceUrlOrUrn'] = isValidNamespaceUrlOrUrn;
      ngModel.$validators['existingId'] = (ns: string) => {

        const model = $scope.model;
        const activeNamespace = $scope.activeNamespace;
        const allowTechnical = $scope.allowTechnical;
        const usedNamespaces: string[] = $scope.usedNamespaces ? $scope.usedNamespaces : [];

        if (usedNamespaces.includes(ns)) {
          return false;
        }

        if (!model) {
          return true;
        } else {     
          for (const modelNamespace of model.getNamespaces()) {
            if (modelNamespace.url === ns) {

              const isTechnical = modelNamespace.namespaceType === NamespaceType.IMPLICIT_TECHNICAL;
              const isActiveNamespace = activeNamespace ? activeNamespace.namespace === modelNamespace.url : false;

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
