import { module as mod } from './module';
import { SearchController, TextAnalysis } from 'app/types/filter';
import { IScope } from 'angular';
import { WithIdAndType, Type } from 'app/types/entity';
import { containsAny } from 'yti-common-ui/utils/array';
import { ifChanged } from 'app/utils/angular';

mod.directive('typesFilter', () => {
  return {
    scope: {
      searchController: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    restrict: 'E',
    template: `
      <div class="form-check form-check-inline" ng-repeat="type in ctrl.types">
        <label class="form-check-label">
          <input class="form-check-input" type="checkbox" checklist-model="ctrl.searchTypes" checklist-value="type" /> {{type | translate}}
        </label>
      </div>
    `,
    controller: TypesFilterController
  };
});



class TypesFilterController {

  searchController: SearchController<WithIdAndType>;

  types: Type[] = ['model', 'class', 'shape', 'attribute', 'association'];
  searchTypes: Type[] = this.types.slice();

  /* @ngInject */
  constructor($scope: IScope) {

    this.searchController.addFilter((item: TextAnalysis<WithIdAndType>) =>
      containsAny(item.item.type, this.searchTypes)
    );

    $scope.$watchCollection(() => this.searchTypes, ifChanged(() => this.searchController.search()));
  }
}
