import { SearchController, TextAnalysis } from 'app/types/filter';
import { IScope } from 'angular';
import { WithDefinedBy } from 'app/types/entity';
import { ComponentDeclaration, ifChanged } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const ProfileFilterComponent: ComponentDeclaration = {
  selector: 'profileFilter',
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
  `,
  controller: forwardRef(() => ProfileFilterController)
};

class ProfileFilterController {

  searchController: SearchController<WithDefinedBy>;
  showProfiles = true;

  /* @ngInject */
  constructor(private $scope: IScope) {
  }

  $onInit() {

    this.searchController.addFilter((item: TextAnalysis<WithDefinedBy>) =>
      this.showProfiles || !item.item.definedBy.isOfType('profile')
    );

    this.$scope.$watch(() => this.showProfiles, ifChanged(() => this.searchController.search()));
  }
}
