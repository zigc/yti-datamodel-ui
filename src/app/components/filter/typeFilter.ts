import { SearchController, TextAnalysis } from '../../types/filter';
import { IScope } from 'angular';
import { isDefined } from 'yti-common-ui/utils/object';
import { ifChanged, LegacyComponent } from '../../utils/angular';
import { Type } from '../../types/entity';
import * as _ from 'lodash';

interface WithNormalizedType {
  normalizedType: Type|null;
}

@LegacyComponent({
  bindings: {
    searchController: '=',
    label: '@',
    defaultType: '='
  },
  template: `
      <select id="type" 
              class="form-control"
              style="width: auto" 
              ng-model="$ctrl.type" 
              ng-options="type | translate for type in $ctrl.types">
        <option value="" translate>All types</option>
      </select>
  `
})
export class TypeFilterComponent {

  searchController: SearchController<WithNormalizedType>;
  type: Type;
  defaultType: Type;
  types: Type[];
  label: string;

  constructor(private $scope: IScope) {
    'ngInject';
  }

  $onInit() {

    if (!!this.defaultType) {
      this.type = this.defaultType;
    }

    this.$scope.$watch(() => this.searchController.items, ifChanged<WithNormalizedType[]>(items => {
      this.types = _.chain(items)
        .map(item => item.normalizedType!)
        .filter(type => isDefined(type))
        .uniq()
        .value();
    }));

    this.searchController.addFilter((item: TextAnalysis<WithNormalizedType>) =>
      !this.type || item.item.normalizedType === this.type
    );

    this.$scope.$watch(() => this.type, ifChanged(() => this.searchController.search()));
  }
}
