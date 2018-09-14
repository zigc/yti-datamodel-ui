import { SearchController, TextAnalysis } from 'app/types/filter';
import { IScope } from 'angular';
import { Exclusion } from 'app/utils/exclusion';
import { ifChanged, LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    searchController: '=',
    exclude: '=',
    searchText: '='
  }
})
export class ExcludedFilterComponent<T> {

  searchController: SearchController<T>;
  searchText: string;
  exclude: Exclusion<T>;

  constructor(private $scope: IScope) {
    'ngInject';
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
