import { ContentExtractor, ContentMatcher, SearchController } from 'app/types/filter';
import { IScope } from 'angular';
import { ComponentDeclaration, ifChanged } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const ContentFilterComponent: ComponentDeclaration = {
  selector: 'contentFilter',
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
  `,
  controller: forwardRef(() => ContentFilterController)
};

class ContentFilterController<T> {

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
