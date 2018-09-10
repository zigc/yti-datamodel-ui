import { DataType } from 'app/entities/dataTypes';
import { ReferenceData } from 'app/entities/referenceData';
import { LanguageContext } from 'app/types/language';
import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const EditableMultipleDataTypeInputComponent: ComponentDeclaration = {
  selector: 'editableMultipleDataTypeInput',
  bindings: {
    ngModel: '=',
    inputType: '=',
    id: '@',
    title: '@',
    referenceData: '=',
    context: '='
  },
  template: `
      <editable-multiple id="{{$ctrl.id}}" data-title="{{$ctrl.title}}" ng-model="$ctrl.ngModel" input="$ctrl.input">
        <input-container>
          <code-value-input-autocomplete reference-data="$ctrl.referenceData" context="$ctrl.context">
            <input id="{{$ctrl.id}}"
                   type="text"
                   restrict-duplicates="$ctrl.ngModel"
                   datatype-input="$ctrl.inputType"
                   ignore-form
                   reference-data="$ctrl.referenceData"
                   ng-model="$ctrl.input" />
          </code-value-input-autocomplete>
        </input-container>
      </editable-multiple>
  `,
  controller: forwardRef(() => EditableMultipleDataTypeInputController)
};

class EditableMultipleDataTypeInputController {

  ngModel: string[];
  input: string;
  inputType: DataType;
  id: string;
  title: string;
  referenceData: ReferenceData;
  context: LanguageContext;
}
