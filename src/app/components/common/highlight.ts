import { ISCEService, IScope } from 'angular';
import { LanguageService } from 'app/services/languageService';
import { Language, LanguageContext } from 'app/types/language';
import { Localizable } from 'yti-common-ui/types/localization';
import { ComponentDeclaration, FilterDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const HighlightComponent: ComponentDeclaration = {
  selector: 'highlight',
  bindings: {
    text: '<',
    search: '<',
    context: '='
  },
  template: '<span ng-bind-html="$ctrl.localizedText | highlight: $ctrl.search"></span>',
  controller: forwardRef(() => HighlightController)
};

class HighlightController {

  text: Localizable;
  search: string;
  context: LanguageContext;

  localizedText: string;

  constructor(private $scope: IScope,
              private languageService: LanguageService) {
    'ngInject';
  }

  $onInit() {
    this.$scope.$watch(() => this.languageService.getModelLanguage(this.context), () => {
      this.localizedText = this.formatText();
    });
  }

  formatText() {

    if (!this.text) {
      return '';
    }

    const regex = createRegex(this.search);
    const primaryTranslation = this.languageService.translate(this.text, this.context);

    if (regex.test(primaryTranslation)) {
      return primaryTranslation;
    } else {

      const secondaryMatch = this.findSecondaryLanguageMatch(regex);

      if (secondaryMatch) {
        return `${primaryTranslation} [${this.formatSecondaryLanguageMatch(secondaryMatch)}]`;
      } else {
        return primaryTranslation;
      }
    }
  }

  findSecondaryLanguageMatch(regex: RegExp): { language: Language, startIndex: number, endIndex: number }|null {

    for (const [language, text] of Object.entries(this.text)) {

      const match = regex.exec(text);

      if (match) {
        const startIndex = match.index;
        const endIndex = startIndex + match[0].length;

        return { language: language as Language, startIndex, endIndex };
      }
    }

    return null;
  }

  formatSecondaryLanguageMatch(match: { language: Language, startIndex: number, endIndex: number }) {

    const secondaryTranslation = this.text[match.language];
    const excessiveThreshold = 30;
    const startIndex = Math.max(0, match.startIndex - excessiveThreshold);
    const endIndex = Math.min(secondaryTranslation.length, match.endIndex + excessiveThreshold);

    let abbreviatedText = '';

    if (startIndex > 0) {
      abbreviatedText += '&hellip;';
    }

    abbreviatedText += secondaryTranslation.slice(startIndex, endIndex);

    if (endIndex < secondaryTranslation.length) {
      abbreviatedText += '&hellip;';
    }

    return `${match.language}: ${abbreviatedText}`;
  }
}

export const HighlightFilter: FilterDeclaration = {
  name: 'highlight',
  factory($sce: ISCEService) {
    'ngInject';
    return (text: string, search: string) => {
      const highlightedText = applyHighlight(text, search);
      return $sce.trustAsHtml(highlightedText);
    };
  }
};

function applyHighlight(text: string, search: string): string {
  if (!text || !search || search.length === 0) {
    return text;
  } else {
    return text.replace(createRegex(search), '<span class="highlight">$1</span>');
  }
}

let cachedRegex: { search: string, value: RegExp };

function createRegex(search: string) {

  if (!cachedRegex || cachedRegex.search !== search) {
    cachedRegex = { search, value: new RegExp('(' + sanitizeRegex(search) + ')', 'gi') };
  }

  return cachedRegex.value;
}

function sanitizeRegex(term: string) {
  return term && term.toString().replace(/[\\\^$*+?.()|{}\[\]]/g, '\\$&');
}
