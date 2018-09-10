import { ISCEService } from 'angular';
import { LanguageContext } from 'app/types/language';
import { Localizable } from 'yti-common-ui/types/localization';
import { ComponentDeclaration, FilterDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const ParagraphizeComponent: ComponentDeclaration = {
  selector: 'paragraphize',
  bindings: {
    text: '=',
    context: '='
  },
  template: '<span ng-bind-html="$ctrl.text | translateValue:$ctrlcontext | paragraphize"></span>',
  controller: forwardRef(() => ParagraphizeController)
};

class ParagraphizeController {
  text: Localizable;
  context: LanguageContext;
}

export const ParagraphizeFilter: FilterDeclaration = {
  name: 'paragraphize',
  /* @ngInject */
  factory($sce: ISCEService) {
    return (text: string) => {
      return $sce.trustAsHtml(applyParagraph(text));
    };
  }
};

const paragraphRegex = new RegExp(`(.*?\n\n})`);

function applyParagraph(text: string): string {
  if (!text) {
    return text;
  } else {
    return text.replace(paragraphRegex, '<p>$1</p>');
  }
}
