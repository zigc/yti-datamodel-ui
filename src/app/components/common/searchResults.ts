import { IAttributes, ICompiledExpression, IDirectiveFactory, IScope, ITranscludeFunction } from 'angular';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { ConfirmationModal } from './confirmationModal';
import { Uri } from 'app/entities/uri';
import { Exclusion } from 'app/utils/exclusion';
import { WithId } from 'app/types/entity';
import { LegacyComponent, modalCancelHandler } from 'app/utils/angular';
import { labelNameToResourceIdIdentifier } from 'yti-common-ui/utils/resource';

export abstract class AddNew {

  id = Uri.randomUUID();

  constructor(public label: string, public show: () => boolean, public glyphiconClass?: (string|{})[]) {
  }

  unwrap() {
    return this;
  }

  isAddNew() {
    return true;
  }
}

class SearchResult<T extends WithId> {

  disabled: boolean;

  constructor(public item: T, public disabledReason: string|null) {
    this.disabled = !!disabledReason;
  }

  get id() {
    return this.item.id;
  }

  unwrap() {
    return this.item;
  }

  isAddNew() {
    return false;
  }
}

@LegacyComponent({
  bindings: {
    items: '=',
    selected: '=',
    exclude: '=',
    onSelect: '&',
    editInProgress: '='
  },
  transclude: true,
  template: require('./searchResults.html')
})
export class SearchResultsComponent<T extends WithId> {

  items: (T|AddNew)[];
  exclude: Exclusion<T>;
  searchResults: (SearchResult<T>|AddNew)[];
  selected: T|AddNew;
  onSelect: ICompiledExpression;
  editInProgress: () => boolean;

  constructor(private $scope: IScope,
              private $element: JQuery,
              private gettextCatalog: GettextCatalog,
              private confirmationModal: ConfirmationModal) {
    'ngInject';
  }

  $onInit() {

    this.$scope.$watchCollection(() => this.items, items => {

      this.$element.parents('.search-results').animate({ scrollTop: 0 }, 0);

      this.searchResults = (items || []).map(item => {
        if (item instanceof AddNew) {
          return item;
        } else {
          const disabledReason = this.exclude && this.exclude(item);
          return new SearchResult(item, disabledReason);
        }
      });
    });
  }

  isVisible(item: SearchResult<T>|AddNew) {
    if (item instanceof AddNew) {
      return item.show();
    } else {
      return true;
    }
  }

  isSelected(item: SearchResult<T>|AddNew) {
    return this.selected === item.unwrap();
  }

  selectItem(item: SearchResult<T>|AddNew) {
    const doSelection = () => {
      this.selected = item.unwrap();
      this.onSelect({item: this.selected});
    };

    if (this.editInProgress && this.editInProgress()) {
      this.confirmationModal.openEditInProgress().then(doSelection, modalCancelHandler);
    } else {
      doSelection();
    }
  }

  title(item: SearchResult<T>|AddNew) {
    if (item instanceof SearchResult && item.disabled) {
      return this.gettextCatalog.getString(item.disabledReason!);
    } else {
      return null;
    }
  }

  generateSearchResultID(item: SearchResult<T>|AddNew): string {
    return item.isAddNew() ? `${'create_new_'}${labelNameToResourceIdIdentifier((item as AddNew).label)}${'_link'}`
                           : `${item.id.toString()}${'_search_result_link'}`;
  }
}

interface SearchResultScope extends IScope {
  searchResult: SearchResult<any>;
}

export const SearchResultTranscludeDirective: IDirectiveFactory = () => {
  return {
    link($scope: SearchResultScope, element: JQuery, _attribute: IAttributes, _ctrl: any, transclude: ITranscludeFunction) {
      transclude((clone, transclusionScope) => {
        (transclusionScope as SearchResultScope).searchResult = $scope.searchResult.item;
        element.append(clone!);
      });
    }
  };
};
