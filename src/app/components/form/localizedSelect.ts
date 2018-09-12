import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { ComponentDeclaration } from '../../utils/angular';
import { forwardRef } from '@angular/core';

export const LocalizedSelectComponent: ComponentDeclaration = {
  selector: 'localizedSelect',
  bindings: {
    value: '=',
    values: '=',
    id: '@',
    displayNameFormatter: '='
  },
  template: `
      <iow-select id="{{$ctrl.id}}" required ng-model="$ctrl.value" options="value in $ctrl.values">
        <span>{{$ctrl.getName(value)}}</span>
      </iow-select>
  `,
  controller: forwardRef(() => LocalizedSelectController)
};

class LocalizedSelectController {
  value: string;
  values: string[];
  id: string;
  displayNameFormatter: (value: string, gettextCatalog: GettextCatalog) => string;

  constructor(private gettextCatalog: GettextCatalog) {
    'ngInject';
  }

  getName(value: string) {
    if (this.displayNameFormatter) {
      return this.displayNameFormatter(value, this.gettextCatalog);
    } else {
      return this.gettextCatalog.getString(value);
    }
  }
}
