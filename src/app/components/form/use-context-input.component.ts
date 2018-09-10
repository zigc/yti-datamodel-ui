import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UseContext, KnownModelType } from 'app/types/entity';

@Component({
  selector: 'app-use-context-input',
  providers: [
    { 
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UseContextInputComponent),
      multi: true
    }
  ],
  template: `
    <dl *ngIf="show">
      <dt>
        <label translate>Use context</label>
      </dt>
      <dd>
        <span *ngIf="!editing">{{useContext | translate}}</span>
        <app-use-context-dropdown id="use_context_input_dropdown"
                                  *ngIf="editing"
                                  [modelType]="modelType"
                                  [formControl]="control"></app-use-context-dropdown>
      </dd>
    </dl>
  `
})
export class UseContextInputComponent implements ControlValueAccessor {

  @Input() editing = false;
  @Input() modelType: KnownModelType;
  control = new FormControl();

  private propagateChange: (fn: any) => void = () => {};

  constructor() {
    this.control.valueChanges.subscribe(x => this.propagateChange(x));
  }

  get useContext() {
    return this.control.value as UseContext;
  }

  get show() {
    return this.editing || this.control.value;
  }

  writeValue(obj: any): void {
    this.control.setValue(obj);
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
  }
}
