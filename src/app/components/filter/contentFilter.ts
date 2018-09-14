import { ContentExtractor, ContentMatcher, SearchController } from 'app/types/filter';
import { IScope } from 'angular';
import { ifChanged, LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    searchController: '=',
    contentMatchers: '=',
    contentExtractors: '='
  },
  template: `
      <div class="form-check form-check-inline" ng-repeat="matcher in $ctrl.contentMatchers">
        <label>
          <input type="checkbox" checklist-model="$ctrl.contentExtractors" checklist-value="matcher.extractor" />
          {{matcher.name | translate}}
        </label>              
      </div>
  `
})
export class ContentFilterComponent<T> {

  searchController: SearchController<T>;
  contentMatchers: ContentMatcher<T>[];
  contentExtractors: ContentExtractor<T>[];

  constructor(private $scope: IScope) {
    'ngInject';
  }

  $onInit() {
    this.$scope.$watchCollection(() => this.contentExtractors, ifChanged(() => this.searchController.search()));
  }
}
