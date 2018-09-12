import { IScope } from 'angular';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { LanguageService } from 'app/services/languageService';
import { isLocalizationDefined } from 'app/utils/language';
import { Language, LanguageContext } from 'app/types/language';
 import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const ModelLanguageChooserComponent: ComponentDeclaration = {
  selector: 'modelLanguageChooser',
  bindings: {
    context: '='
  },
  template: require('./modelLanguageChooser.html'),
  controller: forwardRef(() => ModelLanguageChooserController)
};

class ModelLanguageChooserController {

  context: LanguageContext;

  constructor(private $scope: IScope,
              private languageService: LanguageService,
              private gettextCatalog: GettextCatalog) {
    'ngInject';
  }

  $onInit() {
    this.$scope.$watchCollection(() => this.context && this.context.language, languages => {
      if (languages && languages.indexOf(this.languageService.getModelLanguage(this.context)) === -1) {
        this.languageService.setModelLanguage(this.context, this.context.language[0]);
      }
    });

    this.$scope.$watch(() => this.languageService.UILanguage, (language, previousLanguage) => {
      if (language !== previousLanguage) {
        if (this.context && this.context.language.indexOf(language) !== -1) {
          this.languageService.setModelLanguage(this.context, language);
        }
      }
    });
  }

  localizeLanguageName(language: Language) {
    const key = 'data ' + language;
    const localization = this.gettextCatalog.getString(key);

    if (isLocalizationDefined(key, localization)) {
      return localization;
    } else {
      return this.gettextCatalog.getString('data language') + ': ' + language;
    }
  }

  get language(): Language {
    return this.languageService.getModelLanguage(this.context);
  }

  set language(language: Language) {
    this.languageService.setModelLanguage(this.context, language);
  }
}
