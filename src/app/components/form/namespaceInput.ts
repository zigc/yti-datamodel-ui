import { IAttributes, INgModelController, IScope } from 'angular';
import { isValidNamespace, isValidUrl } from './validators';
import { ImportedNamespace, Model, NamespaceType } from 'app/entities/model';
import { DirectiveDeclaration } from 'app/utils/angular';

interface NamespaceInputScope extends IScope {
  model: Model;
  activeNamespace: ImportedNamespace;
  allowTechnical: boolean;
}

export const NamespaceInputDirective: DirectiveDeclaration = {
  selector: 'namespaceInput',
  factory() {
    return {
      scope: {
        model: '=?',
        activeNamespace: '=?',
        allowTechnical: '=?'
      },
      restrict: 'A',
      require: 'ngModel',
      link($scope: NamespaceInputScope, _element: JQuery, _attributes: IAttributes, ngModel: INgModelController) {

        ngModel.$validators['namespace'] = isValidNamespace;
        ngModel.$validators['url'] = isValidUrl;
        ngModel.$validators['existingId'] = (ns: string) => {

          const model = $scope.model;
          const activeNamespace = $scope.activeNamespace;
          const allowTechnical = $scope.allowTechnical;

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
  }
};
