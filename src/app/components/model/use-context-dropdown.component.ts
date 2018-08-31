import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Placement as NgbPlacement } from '@ng-bootstrap/ng-bootstrap';
import { profileUseContexts, UseContext, libraryUseContexts, KnownModelType } from 'app/types/entity';

export type Placement = NgbPlacement;

@Component({
  selector: 'app-use-context-dropdown',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => UseContextDropdownComponent),
    multi: true
  }],
  template: `
    <div ngbDropdown [placement]="placement">
      <button [id]="'selected_' + id" class="btn btn-dropdown" ngbDropdownToggle>
        <span>{{selection | translate}}</span>
      </button>
      <div ngbDropdownMenu>
        <button *ngFor="let option of options"
                [id]="option + '_' + id"
                (click)="select(option)"
                class="dropdown-item"
                [class.active]="isSelected(option)">
          {{option | translate}}
        </button>
      </div>
    </div>  
  `
})
export class UseContextDropdownComponent implements ControlValueAccessor {

  @Input() id: string;
  @Input() modelType: KnownModelType;
  @Input() placement: Placement = 'bottom-left';

  selection: UseContext;

  private propagateChange: (fn: any) => void = () => {};
  private propagateTouched: (fn: any) => void = () => {};

  get options(): UseContext[] {
    return this.modelType === 'profile' ? profileUseContexts : libraryUseContexts;
  }

  isSelected(option: UseContext) {
    return this.selection === option;
  }

  select(option: UseContext) {
    this.selection = option;
    this.propagateChange(option);
  }

  writeValue(obj: any): void {
    this.selection = obj;
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.propagateTouched = fn;
  }
}
