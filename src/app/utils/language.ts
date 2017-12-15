import { hasValue } from 'yti-common-ui/utils/object';
import { availableLanguages, Language } from '../types/language';
import { Localizable } from 'yti-common-ui/types/localization';

export function isLocalizable(obj: any): obj is Localizable {
  return typeof obj === 'object';
}

function localize(localizable: Localizable, lang: Language, showLang: boolean): string {

  let localization = localizable ? localizable[lang] : '';

  if (Array.isArray(localization)) {
    localization = localization.join(' ');
  }

  if (!localization) {
    return '';
  } else {
    return localization + (showLang ? ` (${lang})` : '');
  }
}

export function translateAny(localizable: Localizable, showLanguage: boolean = false) {
  if (!hasLocalization(localizable)) {
    return '';
  } else {
    return localize(localizable, <Language> Object.keys(localizable)[0], showLanguage);
  }
}

export function createConstantLocalizable(str: string, supportedLanguages?: Language[]) {
  const result: Localizable = {};

  for (const language of supportedLanguages || availableLanguages) {
    result[language] = str;
  }

  return result;
}

export function translate(data: Localizable, language: Language, supportedLanguages?: Language[]): string {

  if (!hasLocalization(data)) {
    return '';
  }

  const localizationForActiveLanguage = localize(data, language, false);

  if (localizationForActiveLanguage) {
    return localizationForActiveLanguage;
  } else if (supportedLanguages) {

    for (const supportedLanguage of supportedLanguages) {

      const localization = localize(data, supportedLanguage, true);

      if (localization) {
        return localization;
      }
    }
  }

  return translateAny(data, true);
}

export function isLocalizationDefined(localizationKey: string, localized: string) {
  return localized.indexOf('[MISSING]') === -1 && localized !== localizationKey;
}


export function allLocalizations(predicate: (localized: string) => boolean, localizable: Localizable) {
  if (localizable) {
    for (const localized of Object.values(localizable)) {
      if (!predicate(localized)) {
        return false;
      }
    }
  }
  return true;
}

export function anyLocalization(predicate: (localized: string) => boolean, localizable: Localizable) {
  if (localizable) {
    for (const localized of Object.values(localizable)) {
      if (predicate(localized)) {
        return true;
      }
    }
  }
  return false;
}

export function localizableContains(localizable: Localizable, searchString: string) {
  return anyLocalization(localized => localized.toLowerCase().includes(searchString.toLowerCase()), localizable);
}

export function hasLocalization(localizable: Localizable) {
  return !!localizable && hasValue(localizable);
}

