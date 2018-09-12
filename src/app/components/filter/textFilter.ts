import { SearchController, TextAnalysis } from 'app/types/filter';
import { IScope } from 'angular';
import { ComponentDeclaration, ifChanged } from 'app/utils/angular';
import { isDefined } from 'yti-common-ui/utils/object';
import { forwardRef } from '@angular/core';

export const TextFilterComponent: ComponentDeclaration = {
  selector: 'textFilter',
  bindings: {
    searchText: '=',
    contentExtractors: '=',
    placeholder: '=',
    searchController: '='
  },
  template: `
          <div class="input-group input-group-lg input-group-search">
            <input autofocus type="text" class="form-control" placeholder="{{$ctrl.placeholder | translate}}"
                   autocomplete="off"
                   id="text_filter_search_input"
                   ng-model="$ctrl.searchText"
                   ignore-dirty
                   ng-model-options="{ debounce: { 'default': 500, 'blur': 0 } }"
                   key-control="$ctrl.searchController.searchResults" />
          </div>
  `,
  controller: forwardRef(() => TextFilterController)
};

class TextFilterController<T> {

  placeholder: string;
  searchController: SearchController<T>;
  searchText: string;

  constructor(private $scope: IScope) {
    'ngInject';
  }

  $onInit() {

    this.searchController.addFilter((item: TextAnalysis<T>) => !this.searchText || isDefined(item.matchScore) || item.score < 2);

    this.$scope.$watch(() => this.searchText, ifChanged(() => this.searchController.search()));
  }
}
