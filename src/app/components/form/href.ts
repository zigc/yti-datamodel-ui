import { IDirectiveFactory, IScope, ITimeoutService } from 'angular';

export const HrefDirective: IDirectiveFactory = ($timeout: ITimeoutService) => {
  'ngInject';
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
};
