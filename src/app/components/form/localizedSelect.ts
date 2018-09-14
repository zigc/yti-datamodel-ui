import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
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
  `
})
export class LocalizedSelectComponent {
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
