import { LanguageContext, UILanguage, Language, availableUILanguages, Localizer as AngularJSLocalizer } from 'app/types/language';
import { translate } from 'app/utils/language';
import { Localizable, Localizer as AngularLocalizer } from 'yti-common-ui/types/localization';
import { SessionService } from './sessionService';
import { TranslateService } from '@ngx-translate/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';

type Localizer = AngularJSLocalizer;
export { Localizer };

export class LanguageService {

  private _modelLanguage: {[entityId: string]: Language} = {};

  language$: BehaviorSubject<UILanguage>;

  constructor(private gettextCatalog: GettextCatalog /* AngularJS */,
              private translateService: TranslateService /* Angular */,
              public localizationStrings: { [key: string]: { [key: string]: string } },
              private sessionService: SessionService) {
    'ngInject';
    const translationDefaultLanguage = 'en';
    gettextCatalog.baseLanguage = translationDefaultLanguage;
    translateService.setDefaultLang(translationDefaultLanguage);

    this.language$ = new BehaviorSubject(sessionService.UILanguage || 'fi');

    this.language$.subscribe(lang => {
      this.sessionService.UILanguage = lang;
      this.gettextCatalog.setCurrentLanguage(lang);
      this.translateService.use(lang);
    });

    this._modelLanguage = sessionService.modelLanguage || {};
  }

  get UILanguage(): UILanguage {
    return this.language$.getValue();
  }

  set UILanguage(language: UILanguage) {
    this.language$.next(language);
  }

  getModelLanguage(context?: LanguageContext): Language {

    const getUILanguageOrFirst = () => {
      if (context!.language.indexOf(this.UILanguage) !== -1) {
        return this.UILanguage;
      } else {
        return context!.language[0];
      }
    };

    if (context) {
      const key = context.id.uri;
      const language = this._modelLanguage[key];
      return language ? language : getUILanguageOrFirst();
    } else {
      return this.UILanguage;
    }
  }

  setModelLanguage(context: LanguageContext, language: Language) {
    this._modelLanguage[context.id.uri] = language;
    this.sessionService.modelLanguage = this._modelLanguage;
  }

  translate(data: Localizable, context?: LanguageContext): string {
    return translate(data, this.getModelLanguage(context), context ? context.language : availableUILanguages);
  }

  translateToGivenLanguage(localizable: Localizable, languageToUse: string|null): string {
    
    if (!localizable || !languageToUse) {
      return '';
    }

    const primaryLocalization = localizable[languageToUse];

    if (primaryLocalization) {
      return primaryLocalization;
    } else {

      const fallbackValue = this.checkForFallbackLanguages(localizable);

      if (fallbackValue != null) {
        return fallbackValue;
      }

      for (const [language, value] of Object.entries(localizable)) {
        if (value) {
          return `${value} (${language})`;
        }
      }

      return '';
    }
  }

  checkForFallbackLanguages(localizable: Localizable): string | null {

    const fallbackLanguages: string[] = ['en', 'fi', 'sv'];

    for (const language of fallbackLanguages) {
      if (this.hasLocalizationForLanguage(localizable, language)) {
        return this.fallbackLocalization(localizable, language);
      }
    }

    return null;
  }

  hasLocalizationForLanguage(localizable: Localizable, language: string) {
    const value: string = localizable[language];
    return value != null && value !== '';
  }

  fallbackLocalization(localizable: Localizable, language: string) {
    const value: string = localizable[language];
    return `${value} (${language})`;
  }

  createLocalizer(context?: LanguageContext) {
    return new DefaultAngularJSLocalizer(this, context);
  }

  findLocalization(language: Language, key: string) {
    const stringsForLang = this.localizationStrings[language];
    return stringsForLang ? stringsForLang[key] : null;
  }
}

export class DefaultAngularLocalizer implements AngularLocalizer {

  translateLanguage$: Observable<Language>;

  constructor(private languageService: LanguageService) {
    this.translateLanguage$ = languageService.language$.asObservable();
  }

  translate(localizable: Localizable, useUILanguage?: boolean): string {
    // FIXME datamodel ui doesn't have concept of ui language boolean but language context
    return this.languageService.translate(localizable);
  }

  translateToGivenLanguage(localizable: Localizable, languageToUse: string|null): string {    
    return this.languageService.translateToGivenLanguage(localizable, languageToUse);
  }
}

export class DefaultAngularJSLocalizer implements AngularJSLocalizer {

  constructor(private languageService: LanguageService, public context?: LanguageContext) {
  }

  get language(): Language {
    return this.languageService.getModelLanguage(this.context);
  }

  translate(data: Localizable): string {
    return this.languageService.translate(data, this.context);
  }

  getStringWithModelLanguageOrDefault(key: string, defaultLanguage: UILanguage): string {

    const askedLocalization = this.languageService.findLocalization(this.language, key);
    if (askedLocalization) {
      return askedLocalization;
    } else {
      const defaultLocalization = this.languageService.findLocalization(defaultLanguage, key);

      if (!defaultLocalization) {
        console.log(`Localization (${key}) not found for default language (${defaultLanguage})`);
        return '??? ' + key;
      } else {
        return defaultLocalization;
      }
    }
  }

  allUILocalizationsForKey(localizationKey: string): string[] {

    const result: string[] = [];

    for (const lang of availableUILanguages) {
      const localization = this.languageService.localizationStrings[lang][localizationKey];

      if (localization) {
        result.push(localization);
      }
    }

    return result;
  }
}
