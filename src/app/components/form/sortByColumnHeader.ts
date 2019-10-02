import { LegacyComponent } from '../../utils/angular';
import { SortByTableColumn, SortBy, ListItem } from '../../types/entity';
import { defaultLabelComparator, defaultDefinedByLabelComparator, defaultCommentComparator } from '../filter/util';
import { comparingDateAllowNull } from '../../utils/comparator';
import { reversed } from 'yti-common-ui/utils/comparator';
import { LanguageService, Localizer } from '../../services/languageService';
import { Model } from '../../entities/model';
import { Exclusion } from '../../utils/exclusion';

@LegacyComponent({
  bindings: {
    headerText: '<',
    columnName: '<',
    sortBy: '<',
    filterExclude: '<',
    model: '<'
  },
  template: `    
    <div ng-click="$ctrl.setSortBy()">
      <button id="{{'sort_by_' + $ctrl.columnName + '_button'}}"
              type="button"
              class="btn btn-link pl-0"
              ng-class="{'sort-by-selected': $ctrl.isSortBySelected()}">
        {{$ctrl.headerText | translate}}
      </button>
      <i id="{{'sort_up_' + $ctrl.columnName + '_icon'}}" class="fas fa-sort-up primary-color-item" ng-if="$ctrl.sortUp()"></i>
      <i id="{{'sort_down_' + $ctrl.columnName + '_icon'}}" class="fas fa-sort-down primary-color-item" ng-if="$ctrl.sortDown()"></i>
    </div>    
  `
})
export class SortByColumnHeaderComponent {
  headerText: string;
  columnName: SortByTableColumn;
  model: Model;
  sortBy: SortBy<ListItem>
  filterExclude: Exclusion<ListItem>;

  private localizer: Localizer;

  constructor(private languageService: LanguageService) {
    'ngInject';
  }

  $onInit() {
    this.localizer = this.languageService.createLocalizer(this.model);
  }

  setSortBy() {
    if (this.sortBy.name === this.columnName) {
      this.sortBy.descOrder = !this.sortBy.descOrder;
    } else {
      this.sortBy.name = this.columnName;
      this.sortBy.descOrder = false;
    }

    if (this.columnName === 'name') {
      this.sortBy.comparator = defaultLabelComparator(this.localizer, this.filterExclude);
    } else if (this.columnName === 'model') {
      this.sortBy.comparator = defaultDefinedByLabelComparator(this.localizer, this.filterExclude);
    } else if (this.columnName === 'description') {
      this.sortBy.comparator = defaultCommentComparator(this.localizer, this.filterExclude);
    } else if (this.columnName === 'modifiedAt') {
      this.sortBy.comparator = comparingDateAllowNull(item => item.item.modifiedAt);
    }

    this.sortBy.comparator = this.sortBy.descOrder ? reversed(this.sortBy.comparator) : this.sortBy.comparator;
  }

  isSortBySelected() {
    return this.sortBy.name === this.columnName;
  }

  sortUp() {
    return this.sortBy.name === this.columnName && this.sortBy.descOrder;
  }

  sortDown() {
    return this.sortBy.name === this.columnName && !this.sortBy.descOrder;
  }
}
