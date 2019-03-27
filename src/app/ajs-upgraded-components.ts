import { Directive, ElementRef, EventEmitter, Injector, Input, Output } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';
import { Model } from './entities/model';
import { EditorContainer } from './components/model/modelControllerService';
import { LanguageContext } from './types/language';
import { ModelAndSelection } from './services/subRoutingHackService';
import { BehaviorSubject } from 'rxjs';
import { Class } from './entities/class';
import { Predicate } from './entities/predicate';

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

  constructor(elementRef: ElementRef, injector: Injector) {
    super('export', elementRef, injector);
  }
}
