import { Directive, ElementRef, EventEmitter, Injector, Input, Output } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';
import { Model } from './entities/model';
import { EditorContainer } from './components/model/modelControllerService';
import { LanguageContext } from './types/language';
import { ModelAndSelection } from './services/subRoutingHackService';
import { BehaviorSubject } from 'rxjs';
import { Class } from './entities/class';
import { Predicate } from './entities/predicate';
import { ListItem, SortBy, SortByTableColumn } from './types/entity';
import { Exclusion } from './utils/exclusion';
import { Localizable } from 'yti-common-ui/types/localization';

@Directive({
  selector: 'model-page'
})
export class ModelPageDirective extends UpgradeComponent {
  @Input() parent: EditorContainer;
  @Input() currentSelection: BehaviorSubject<ModelAndSelection>;
  @Output() makeSelection: EventEmitter<{ resourceCurie?: string, propertyId?: string }>;
  @Output() updateNamespaces: EventEmitter<Set<string>>;

  constructor(elementRef: ElementRef, injector: Injector) {
    super('modelPage', elementRef, injector);
  }
}

@Directive({
  selector: 'model-view'
})
export class ModelViewDirective extends UpgradeComponent {
  @Input() parent: EditorContainer;
  @Input() id: string;
  @Input() model: Model;
  @Input() namespacesInUse: Set<string>;
  @Output() deleted: EventEmitter<Model>;
  @Output() updated: EventEmitter<Model>;

  constructor(elementRef: ElementRef, injector: Injector) {
    super('modelView', elementRef, injector);
  }
}

@Directive({
  selector: 'model-language-chooser'
})
export class ModelLanguageChooserDirective extends UpgradeComponent {
  @Input() context: LanguageContext;

  constructor(elementRef: ElementRef, injector: Injector) {
    super('modelLanguageChooser', elementRef, injector);
  }
}

@Directive({
  selector: 'export-component'
})
export class ExportDirective extends UpgradeComponent {
  @Input() entity: Model | Class | Predicate;
  @Input() context: LanguageContext;
  @Input() idPrefix: string;

  constructor(elementRef: ElementRef, injector: Injector) {
    super('export', elementRef, injector);
  }
}

@Directive({
  selector: 'model-action-menu'
})
export class ModelActionMenuDirective extends UpgradeComponent {
  @Input() isMessagingEnabled: boolean;
  @Input() hasSubscription: boolean;
  @Input() entity: Model;
  @Input() context: LanguageContext;
  @Input() editing: boolean;
  @Output() changeHasSubscription: EventEmitter<boolean>;

  constructor(elementRef: ElementRef, injector: Injector) {
    super('modelActionMenu', elementRef, injector);
  }
}

@Directive({
  selector: 'sort-by-column-header'
})
export class SortByColumnHeaderDirective extends UpgradeComponent {
  @Input() headerText: string;
  @Input() columnName: SortByTableColumn;
  @Input() sortBy: SortBy<ListItem>;
  @Input() filterExclude: Exclusion<ListItem>;
  @Input() model: Model;

  constructor(elementRef: ElementRef, injector: Injector) {
      super('sortByColumnHeader', elementRef, injector);
  }
}

@Directive({
  selector: 'highlight'
})
export class HighlightDirective extends UpgradeComponent {
  @Input() text: Localizable;
  @Input() search: string;
  @Input() context: LanguageContext;

  constructor(elementRef: ElementRef, injector: Injector) {
    super('highlight', elementRef, injector);
  }
}
