import { SearchController, TextAnalysis } from 'app/types/filter';
import { IScope } from 'angular';
import { WithDefinedBy } from 'app/types/entity';
import { ifChanged, LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    searchController: '=',
    onlySelection: '='
  },
  template: `
      <div class="form-check form-check-inline" ng-hide="$ctrl.onlySelection">
        <label>
          <input type="checkbox" ng-model="$ctrl.showProfiles">
          {{'Show classes defined in profiles' | translate}}
        </label>
      </div>
  `
})
export class ProfileFilterComponent {

  searchController: SearchController<WithDefinedBy>;
  showProfiles = true;

  constructor(private $scope: IScope) {
    'ngInject';
  }

  $onInit() {

    this.searchController.addFilter((item: TextAnalysis<WithDefinedBy>) =>
      this.showProfiles || !item.item.definedBy.isOfType('profile')
    );

    this.$scope.$watch(() => this.showProfiles, ifChanged(() => this.searchController.search()));
  }
}
