import { IAttributes, IDocumentService, IScope, ITranscludeFunction } from 'angular';
import { DirectiveDeclaration } from 'app/utils/angular';

interface NgIfBodyAttributes extends IAttributes {
  ngIfBody: string;
}

export const NgIfBodyDirective: DirectiveDeclaration = {
  selector: 'ngIfBody',
  /* @ngInject */
  factory($document: IDocumentService) {
    return {
      transclude: 'element',
      priority: 600,
      terminal: true,
      restrict: 'A',
      link($scope: IScope, _element: JQuery, attributes: NgIfBodyAttributes, _ctrls: any, $transclude: ITranscludeFunction) {

        let childScope: IScope | undefined | null;
        let previousElement: JQuery | undefined | null;

        const body = jQuery($document.find('body'));

        function cleanFromBody() {
          if (previousElement) {
            previousElement.remove();
            previousElement = null;
          }

          if (childScope) {
            childScope.$destroy();
            childScope = null;
          }
        }

        $scope.$watch(attributes.ngIfBody, (value) => {
          if (value) {
            if (!childScope) {
              // append to body
              $transclude((clone, newScope) => {
                body.append(clone!);
                previousElement = clone;
                childScope = newScope;
              });
            }
          } else {
            cleanFromBody();
          }
        });

        $scope.$on('$destroy', cleanFromBody);
      }
    };
  }
};
