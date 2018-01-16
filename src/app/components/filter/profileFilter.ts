import { module as mod } from './module';
import { SearchController, TextAnalysis } from 'app/types/filter';
import { IScope } from 'angular';
import { WithDefinedBy } from 'app/types/entity';
import { ifChanged } from 'app/utils/angular';

mod.directive('profileFilter', () => {
  return {
    scope: {
      searchController: '=',
      onlySelection: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    restrict: 'E',
    template: `
      <div class="form-check form-check-inline" ng-hide="ctrl.onlySelection">
        <label>
          <input type="checkbox" ng-model="ctrl.showProfiles">
          {{'Show classes defined in profiles' | translate}}
        </label>
      </div>
    `,
    controller: ProfileFilterController
  };
});

class ProfileFilterController {

  searchController: SearchController<WithDefinedBy>;
  showProfiles = true;

  /* @ngInject */
  constructor($scope: IScope) {
    this.searchController.addFilter((item: TextAnalysis<WithDefinedBy>) =>
        this.showProfiles || !item.item.definedBy.isOfType('profile')
    );

    $scope.$watch(() => this.showProfiles, ifChanged(() => this.searchController.search()));
  }
}
