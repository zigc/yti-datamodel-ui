import { Component, EventEmitter, Input, Output } from '@angular/core';
import { KnownPredicateType, ListItem, SortBy } from '../../types/entity';
import { Exclusion } from '../../utils/exclusion';
import { Model } from '../../entities/model';
import { AbstractPredicate, Predicate, PredicateListItem } from '../../entities/predicate';
import { GettextCatalogWrapper } from '../../ajs-upgraded-providers';
import { DisplayItemFactory, Value } from '../form/displayItemFactory';
import { modalCancelHandler } from '../../utils/angular';
import { ShowPredicateInfoModal } from './showPredicateInfoModal';
import { TranslateService } from '@ngx-translate/core';
import { IPageInfo } from 'ngx-virtual-scroller';

@Component({
  selector: 'app-search-predicate-table-modal-content',
  styleUrls: ['../../../styles/shared/searchTableModalContent.scss', './searchPredicateTableModalContent.scss'],
  template: `
    <div class="table-content-container">
      <table class="table table-sm header-table" width="100%">
        <thead>
        <tr>
          <th class="name-col">
            <sort-by-column-header [headerText]="'Name'"
                                   [columnName]="'name'"
                                   [model]="model"
                                   [sortBy]="sortBy"
                                   [filterExclude]="filterExclude"></sort-by-column-header>
          </th>
          <th class="model-col">
            <sort-by-column-header [headerText]="'Model'"
                                   [columnName]="'model'"
                                   [model]="model"
                                   [sortBy]="sortBy"
                                   [filterExclude]="filterExclude"></sort-by-column-header>
          </th>
          <th class="description-col">
            <sort-by-column-header [headerText]="'Description'"
                                   [columnName]="'description'"
                                   [model]="model"
                                   [sortBy]="sortBy"
                                   [filterExclude]="filterExclude"></sort-by-column-header>
          </th>
          <th class="modified-at-col">
            <sort-by-column-header [headerText]="'Modified at'"
                                   [columnName]="'modifiedAt'"
                                   [model]="model"
                                   [sortBy]="sortBy"
                                   [filterExclude]="filterExclude"></sort-by-column-header>
          </th>
          <th class="menu-col"></th>
        </tr>
        </thead>
      </table>
      <virtual-scroller #scroll class="scroller-component" [items]="searchResults" [enableUnequalChildrenSizes]="true"
                        (vsEnd)="scrollEnd($event)" [useMarginInsteadOfTranslate]="true">
        <table class="table table-sm content-table" width="100%">
          <tbody #container>
          <tr *ngFor="let searchResult of scroll.viewPortItems; trackBy: trackBy"
              [id]="searchResultID(searchResult)"
              [ngClass]="{'search-result': true, 'active': isSelected(searchResult)}"
              (click)="itemSelected.emit(searchResult)"
              [title]="itemTitle(searchResult)"
              key-control-selection>

            <td class="name-col">
              <div>
                <i class="glyph-icon" [ngClass]="glyphIconStyle(searchResult)"></i>
                <app-ajax-loading-indicator-small class="pr-1"
                                                  *ngIf="isLoadingSelection(searchResult)"></app-ajax-loading-indicator-small>
                <highlight [text]="searchResult.label" [context]="model" [search]="searchText"></highlight>
              </div>
              <a [href]="model.linkToResource(searchResult.id)" target="_blank"
                 [innerHTML]="searchResult.id.compact | highlight: searchText"></a>
              <div class="pt-1">
                <app-status [status]="searchResult.status"></app-status>
              </div>
            </td>
            <td class="model-col">
              <div>
                <highlight [text]="searchResult.definedBy.label" [context]="model" [search]="searchText"></highlight>
              </div>
              <div *ngIf="searchResult.definedBy.normalizedType">
                {{searchResult.definedBy.normalizedType | translate}}
              </div>
              <div>
                <span class="information-domains">
                  <span class="badge badge-light" *ngFor="let infoDomain of searchResult.definedBy.classifications">
                    {{showItemValue(infoDomain.label)}}
                  </span>
                </span>
              </div>
            </td>
            <td class="description-col">
              <highlight [text]="searchResult.comment" [context]="model" [search]="searchText"></highlight>
            </td>
            <td class="modified-at-col">
              {{showItemValue(searchResult.modifiedAt)}}
            </td>
            <td class="menu-col">
              <a [id]="predicateInfoLinkID(searchResult)"
                 href="#"
                 *ngIf="isSelected(searchResult)"
                 (click)="showClassInfo()"
                 [title]="infoLinkTitle">
                <i class="fas fa-clone glyph-icon" aria-hidden="true"></i>
              </a>
            </td>
          </tr>
          </tbody>
        </table>
      </virtual-scroller>
    </div>
  `
})
export class SearchPredicateTableModalContentComponent {
  @Input() sortBy: SortBy<ListItem>;
  @Input() filterExclude: Exclusion<ListItem>;
  @Input() model: Model;
  @Input() searchText: string;
  @Input() searchResults: PredicateListItem[] = [];
  @Input() exclude: Exclusion<AbstractPredicate>;
  @Input() selectedItem?: PredicateListItem;
  @Input() selection?: Predicate;
  @Input() type: KnownPredicateType | null;
  @Output() itemSelected = new EventEmitter<PredicateListItem | undefined>();
  @Output() loadMore = new EventEmitter<number>();

  constructor(private gettextCatalogWrapper: GettextCatalogWrapper,
              private translateService: TranslateService,
              private displayItemFactory: DisplayItemFactory,
              protected showPredicateInfoModal: ShowPredicateInfoModal) {
  }

  get infoLinkTitle() {
    return this.translateService.instant(`Show ${this.type} information`);
  }

  isSelected(item?: AbstractPredicate): boolean {
    return this.selectedItem === item;
  }

  isLoadingSelection(item: PredicateListItem): boolean {
    const selection = this.selection;
    return item === this.selectedItem && (!selection || (selection instanceof Predicate && !item.id.equals(selection.id)));
  }

  searchResultID(item: AbstractPredicate): string {
    return `${item.id.toString()}_search_class_link`;
  }

  itemTitle(item: AbstractPredicate): string {
    const disabledReason = this.exclude(item);
    if (!!disabledReason) {
      return this.gettextCatalogWrapper.gettextCatalog.getString(disabledReason);
    } else {
      return '';
    }
  }

  showItemValue(value: Value): string {
    return this.displayItemFactory.create({
      context: () => this.model,
      value: () => value
    }).displayValue;
  }

  showClassInfo() {
    return this.showPredicateInfoModal.open(this.model, this.selection!).then(null, modalCancelHandler);
  }

  predicateInfoLinkID(item: AbstractPredicate) {
    return `show_predicate_info_${item.id.toString()}_link`;
  }

  glyphIconStyle(item: PredicateListItem) {
    const styles = Array.from(item.glyphIconClass);
    styles.push('pr-1');

    return styles;
  }

  trackBy(index: number, item: PredicateListItem) {
    return item.id;
  }

  scrollEnd(info: IPageInfo) {
    if (info.endIndex === this.searchResults.length - 1) {
      this.loadMore.emit(info.endIndex);
    }
  }
}
