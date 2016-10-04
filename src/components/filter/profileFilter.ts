import { module as mod } from './module';
import { SearchController } from './contract';
import { IScope } from 'angular';
import { isDefined } from '../../utils/object';
import { WithDefinedBy } from '../contracts';
import { ifChanged } from '../../utils/angular';

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
            <div class="form-group" ng-hide="ctrl.onlySelection">
              <div class="checkbox">
                <label><input type="checkbox" ng-model="ctrl.showProfiles">{{'Show classes defined in profiles' | translate}}</label>
              </div>
            </div>
    `,
    controller: ProfileFilterController
  };
});

class ProfileFilterController {

  searchController: SearchController<WithDefinedBy>;
  showProfiles: boolean = true;

  /* @ngInject */
  constructor($scope: IScope) {
    this.searchController.addFilter((item: WithDefinedBy) =>
        this.showProfiles || !isDefined(item.definedBy) || !item.definedBy.isOfType('profile')
    );

    $scope.$watch(() => this.showProfiles, ifChanged(() => this.searchController.search()));
  }
}
