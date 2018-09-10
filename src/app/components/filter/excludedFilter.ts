import { SearchController, TextAnalysis } from 'app/types/filter';
import { IScope } from 'angular';
import { Exclusion } from 'app/utils/exclusion';
import { ComponentDeclaration, ifChanged } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const ExcludedFilterComponent: ComponentDeclaration = {
  selector: 'excludedFilter',
  bindings: {
    searchController: '=',
    exclude: '=',
    searchText: '='
  },
  controller: forwardRef(() => ExcludedFilterController)
};

class ExcludedFilterController<T> {

  searchController: SearchController<T>;
  searchText: string;
  exclude: Exclusion<T>;

  /* @ngInject */
  constructor(private $scope: IScope) {
  }

  $onInit() {
    this.searchController.addFilter((item: TextAnalysis<T>) =>
      this.showExcluded || !this.exclude(item.item)
    );

    this.$scope.$watch(() => this.exclude, ifChanged(() => this.searchController.search()));
  }

  get showExcluded() {
    return !!this.searchText;
  }
}
