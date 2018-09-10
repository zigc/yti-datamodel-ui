import { ReferenceDataService } from 'app/services/referenceDataService';
import { LanguageService, Localizer } from 'app/services/languageService';
import { ReferenceData, ReferenceDataCode } from 'app/entities/referenceData';
import { LanguageContext } from 'app/types/language';
 import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const CodeValueInputAutocompleteComponent: ComponentDeclaration = {
  selector: 'codeValueInputAutocomplete',
  bindings: {
    referenceData: '=',
    context: '='
  },
  transclude: true,
  template: `
      <autocomplete datasource="$ctrl.datasource" matcher="$ctrl.matcher" value-extractor="$ctrl.valueExtractor" formatter="$ctrl.formatter">
        <ng-transclude></ng-transclude>
      </autocomplete>
  `,
  controller: forwardRef(() => CodeValueInputAutocompleteController)
};

export class CodeValueInputAutocompleteController {

  referenceData: ReferenceData[];
  context: LanguageContext;
  localizer: Localizer;

  /* @ngInject */
  constructor(private referenceDataService: ReferenceDataService, languageService: LanguageService) {
    this.localizer = languageService.createLocalizer(this.context);
  }

  datasource = () => this.referenceDataService.getReferenceDataCodes(this.referenceData);

  formatter = (codeValue: ReferenceDataCode) => `${this.localizer.translate(codeValue.title)} (${codeValue.identifier})`;

  valueExtractor = (codeValue: ReferenceDataCode) => codeValue.identifier;
}
