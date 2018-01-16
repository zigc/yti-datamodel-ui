import { module as mod } from './module';
import { SearchController, ContentExtractor, ContentMatcher } from 'app/types/filter';
import { IScope } from 'angular';
import { ifChanged } from 'app/utils/angular';

mod.directive('contentFilter', () => {
  return {
    scope: {
      searchController: '=',
      contentMatchers: '=',
      contentExtractors: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    restrict: 'E',
    template: `
      <div class="form-check form-check-inline" ng-repeat="matcher in ctrl.contentMatchers">
        <label>
          <input type="checkbox" checklist-model="ctrl.contentExtractors" checklist-value="matcher.extractor" />
          {{matcher.name | translate}}
        </label>              
      </div>
    `,
    controller: ProfileFilterController
  };
});

class ProfileFilterController<T> {

  searchController: SearchController<T>;
  contentMatchers: ContentMatcher<T>[];
  contentExtractors: ContentExtractor<T>[];

  /* @ngInject */
  constructor($scope: IScope) {
    $scope.$watchCollection(() => this.contentExtractors, ifChanged(() => this.searchController.search()));
  }
}
