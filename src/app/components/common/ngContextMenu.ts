import { IAttributes, IParseService, IScope } from 'angular';
import { DirectiveDeclaration } from 'app/utils/angular';

interface ContextMenuAttributes extends IAttributes {
  ngContextMenu: string;
}

export const ContextMenuDirective: DirectiveDeclaration = {
  selector: 'ngContextMenu',
  /* @ngInject */
  factory($parse: IParseService) {
    return {
      link(scope: IScope, element: JQuery, attrs: ContextMenuAttributes) {

        const fn = $parse(attrs.ngContextMenu);

        element.on('contextmenu', e => {

          e.preventDefault();

          scope.$apply(() => {
            fn(scope, {$event: e});
          });
        });
      }
    };
  }
};
