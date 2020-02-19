import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ListItem, SortBy } from '../../types/entity';
import { Exclusion } from '../../utils/exclusion';
import { Model } from '../../entities/model';
import { AbstractClass, Class, ClassListItem } from '../../entities/class';
import { GettextCatalogWrapper } from '../../ajs-upgraded-providers';
import { ExternalEntity } from '../../entities/externalEntity';
import { DisplayItemFactory, Value } from '../form/displayItemFactory';
import { modalCancelHandler } from '../../utils/angular';
import { ShowClassInfoModal } from './showClassInfoModal';
import { IPageInfo } from 'ngx-virtual-scroller';
import { makeSimpleSearchRegexp } from 'yti-common-ui/utils/search';

@Component({
  selector: 'app-search-class-table-modal-content',
  styleUrls: ['../../../styles/shared/searchTableModalContent.scss', './searchClassTableModalContent.scss'],
  template: `
    <div class="table-content-container">
      <div class="header-table-container">
        <table class="table table-sm header-table">
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
            <!-- Showing of super class is not implemented yet. -->
            <!-- <th style="width: 20%" translate>Super class</th> -->
            <th *ngIf="!showOnlyExternalClasses" class="modified-at-col">
              <sort-by-column-header [headerText]="'Modified at'"
                                     [columnName]="'modifiedAt'"
                                     [model]="model"
                                     [sortBy]="sortBy"
                                     [filterExclude]="filterExclude"></sort-by-column-header>
            </th>
            <th class="info-col"></th>
          </tr>
          </thead>
        </table>
        <div class="header-table-padding"></div>
      </div>
      <virtual-scroller #scroll class="scroller-component" [items]="searchResults" [enableUnequalChildrenSizes]="true"
                        (vsEnd)="scrollEnd($event)">
        <table class="table table-sm content-table">
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
              <a [href]="model.linkToResource(searchResult.id)" target="_blank" rel="noopener noreferrer"
                 [innerHTML]="(searchResult.id.compact | highlight: simpleSearchRegexp) + '&nbsp;<i class=&quot;fas fa-external-link-alt x-small-item&quot;></i>'"></a>
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
            <!-- Showing of super class is not implemented yet. -->
            <!--
            <td>
              {{$ctrl.model.linkToResource(searchResult.superClassOf)}}
            </td>
            -->
            <td *ngIf="!showOnlyExternalClasses" class="modified-at-col">
              {{showItemValue(searchResult.modifiedAt)}}
            </td>
            <td class="info-col">
              <a [id]="classInfoLinkID(searchResult)"
                 href="#"
                 *ngIf="isSelected(searchResult)"
                 (click)="showClassInfo()"
                 [title]="('Show class information') | translate">
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
export class SearchClassTableModalContentComponent implements OnChanges {
  @Input() sortBy: SortBy<ListItem>;
  @Input() filterExclude: Exclusion<ListItem>;
  @Input() model: Model;
  @Input() searchText: string;
  @Input() searchResults: ClassListItem[] = [];
  @Input() exclude: Exclusion<AbstractClass>;
  @Input() selectedItem?: ClassListItem;
  @Input() selection?: Class | ExternalEntity;
  @Input() showOnlyExternalClasses: boolean;
  @Output() itemSelected = new EventEmitter<ClassListItem | undefined>();
  @Output() loadMore = new EventEmitter<number>();

  simpleSearchRegexp?: RegExp;

  constructor(private gettextCatalogWrapper: GettextCatalogWrapper,
              private displayItemFactory: DisplayItemFactory,
              protected showClassInfoModal: ShowClassInfoModal) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    const searchChange = changes['searchText'];
    if (searchChange) {
      if (searchChange.currentValue && typeof searchChange.currentValue === 'string') {
        this.simpleSearchRegexp = makeSimpleSearchRegexp(searchChange.currentValue, true);
      } else {
        this.simpleSearchRegexp = undefined;
      }
    }
  }

  isSelected(item?: AbstractClass): boolean {
    return this.selectedItem === item;
  }

  isLoadingSelection(item: ClassListItem): boolean {
    const selection = this.selection;
    return item === this.selectedItem && (!selection || (selection instanceof Class && !item.id.equals(selection.id)));
  }

  searchResultID(item: AbstractClass): string {
    return `${item.id.toString()}_search_class_link`;
  }

  itemTitle(item: AbstractClass): string {
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
    return this.showClassInfoModal.open(this.model, this.selection!).then(null, modalCancelHandler);
  }

  classInfoLinkID(item: AbstractClass) {
    return `show_class_info_${item.id.toString()}_link`;
  }

  glyphIconStyle(item: ClassListItem) {
    const styles = Array.from(item.glyphIconClass);
    styles.push('pr-1');

    return styles;
  }

  trackBy(index: number, item: ClassListItem) {
    return item.id;
  }

  scrollEnd(info: IPageInfo) {
    if (info.endIndex === this.searchResults.length - 1) {
      this.loadMore.emit(info.endIndex);
    }
  }
}
