import { module as mod } from './module';
import { SearchController, TextAnalysis } from 'app/types/filter';
import { IScope } from 'angular';
import { isDefined } from 'yti-common-ui/utils/object';
import { ComponentDeclaration, ifChanged } from 'app/utils/angular';
import { Type } from 'app/types/entity';
import * as _ from 'lodash';
import { forwardRef } from '@angular/core';

export const TypeFilterComponent: ComponentDeclaration = {
  selector: 'typeFilter',
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
  `,
  controller: forwardRef(() => TypeFilterController)
};

interface WithNormalizedType {
  normalizedType: Type|null;
}

class TypeFilterController {

  searchController: SearchController<WithNormalizedType>;
  type: Type;
  defaultType: Type;
  types: Type[];
  label: string;

  /* @ngInject */
  constructor(private $scope: IScope) {
  }

  $onInit() {
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
