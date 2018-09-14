import { ReferenceDataService } from 'app/services/referenceDataService';
import { LanguageService, Localizer } from 'app/services/languageService';
import { ReferenceData, ReferenceDataCode } from 'app/entities/referenceData';
import { LanguageContext } from 'app/types/language';
import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    referenceData: '=',
    context: '='
  },
  transclude: true,
  template: `
      <autocomplete datasource="$ctrl.datasource" matcher="$ctrl.matcher" value-extractor="$ctrl.valueExtractor" formatter="$ctrl.formatter">
        <ng-transclude></ng-transclude>
      </autocomplete>
  `
})
export class CodeValueInputAutocompleteComponent {

  referenceData: ReferenceData[];
  context: LanguageContext;
  localizer: Localizer;

  constructor(private referenceDataService: ReferenceDataService, languageService: LanguageService) {
    'ngInject';
    this.localizer = languageService.createLocalizer(this.context);
  }

  datasource = () => this.referenceDataService.getReferenceDataCodes(this.referenceData);

  formatter = (codeValue: ReferenceDataCode) => `${this.localizer.translate(codeValue.title)} (${codeValue.identifier})`;

  valueExtractor = (codeValue: ReferenceDataCode) => codeValue.identifier;
}
