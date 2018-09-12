import { SearchController, TextAnalysis } from 'app/types/filter';
import { IScope } from 'angular';
import { Type, WithIdAndType } from 'app/types/entity';
import { containsAny } from 'yti-common-ui/utils/array';
import { ComponentDeclaration, ifChanged } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const TypesFilterComponent: ComponentDeclaration = {
  selector: 'typesFilter',
  bindings: {
    searchController: '='
  },
  template: `
      <div class="form-check form-check-inline" ng-repeat="type in $ctrl.types">
        <label class="form-check-label">
          <input class="form-check-input" type="checkbox" checklist-model="$ctrl.searchTypes" checklist-value="type" /> {{type | translate}}
        </label>
      </div>
  `,
  controller: forwardRef(() => TypesFilterController)
};

class TypesFilterController {

  searchController: SearchController<WithIdAndType>;

  types: Type[] = ['model', 'class', 'shape', 'attribute', 'association'];
  searchTypes: Type[] = this.types.slice();

  constructor(private $scope: IScope) {
    'ngInject';
  }

  $onInit() {

    this.searchController.addFilter((item: TextAnalysis<WithIdAndType>) =>
      containsAny(item.item.type, this.searchTypes)
    );

    this.$scope.$watchCollection(() => this.searchTypes, ifChanged(() => this.searchController.search()));
  }
}
