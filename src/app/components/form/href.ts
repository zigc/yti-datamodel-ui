import { IScope, ITimeoutService } from 'angular';
import { DirectiveDeclaration } from 'app/utils/angular';

export const HrefDirective: DirectiveDeclaration = {
  selector: 'ngHref',
  /* @ngInject */
  factory($timeout: ITimeoutService) {
    return {
      restrict: 'A',
      link(_$scope: IScope, element: JQuery) {
        $timeout(() => {
          const link = element.attr('href');
          if (link && !link.startsWith('/') && !link.startsWith('#')) {
            element.attr('target', '_blank');
          }
        });
      }
    };
  }
};
