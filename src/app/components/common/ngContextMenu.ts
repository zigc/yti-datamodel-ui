import { IAttributes, IDirectiveFactory, IParseService, IScope } from 'angular';

interface ContextMenuAttributes extends IAttributes {
  ngContextMenu: string;
}

export const ContextMenuDirective: IDirectiveFactory = ($parse: IParseService) => {
  'ngInject';
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
};
