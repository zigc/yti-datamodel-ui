import { Uri } from 'app/entities/uri';
import { Localizable } from 'yti-common-ui/types/localization';

// language codes according to ISO_639-1 specification
export type Language =
    'ab' | 'aa' | 'af' | 'ak' | 'sq' | 'am' | 'ar' | 'an' | 'hy' | 'as' | 'av' | 'ae' | 'ay'
  | 'az' | 'bm' | 'ba' | 'eu' | 'be' | 'bn' | 'bh' | 'bi' | 'bs' | 'br' | 'bg' | 'my' | 'ca'
  | 'ch' | 'ce' | 'ny' | 'zh' | 'cv' | 'kw' | 'co' | 'cr' | 'hr' | 'cs' | 'da' | 'dv' | 'nl'
  | 'dz' | 'en' | 'eo' | 'et' | 'ee' | 'fo' | 'fj' | 'fi' | 'fr' | 'ff' | 'gl' | 'ka' | 'de'
  | 'el' | 'gn' | 'gu' | 'ht' | 'ha' | 'he' | 'hz' | 'hi' | 'ho' | 'hu' | 'ia' | 'id' | 'ie'
  | 'ga' | 'ig' | 'ik' | 'io' | 'is' | 'it' | 'iu' | 'ja' | 'jv' | 'kl' | 'kn' | 'kr' | 'ks'
  | 'kk' | 'km' | 'ki' | 'rw' | 'ky' | 'kv' | 'kg' | 'ko' | 'ku' | 'kj' | 'la' | 'lb' | 'lg'
  | 'li' | 'ln' | 'lo' | 'lt' | 'lu' | 'lv' | 'gv' | 'mk' | 'mg' | 'ms' | 'ml' | 'mt' | 'te'
  | 'mr' | 'mh' | 'mn' | 'na' | 'nv' | 'nd' | 'ne' | 'ng' | 'nb' | 'nn' | 'no' | 'ii' | 'nr'
  | 'oc' | 'oj' | 'cu' | 'om' | 'or' | 'os' | 'pa' | 'pi' | 'fa' | 'pl' | 'ps' | 'pt' | 'qu'
  | 'rm' | 'rn' | 'ro' | 'ru' | 'sa' | 'sc' | 'sd' | 'se' | 'sm' | 'sg' | 'sr' | 'gd' | 'sn'
  | 'si' | 'sk' | 'sl' | 'st' | 'es' | 'su' | 'sw' | 'ss' | 'sv' | 'ta' | 'tg' | 'th' | 'ti'
  | 'bo' | 'tk' | 'tl' | 'tn' | 'to' | 'tr' | 'ts' | 'tt' | 'tw' | 'ty' | 'ug' | 'uk' | 'ur'
  | 'uz' | 've' | 'vi' | 'vo' | 'wa' | 'cy' | 'wo' | 'fy' | 'xh' | 'yi' | 'yo' | 'za' | 'zu';

export const availableLanguages: Language[] = [
    'ab', 'aa', 'af', 'ak', 'sq', 'am', 'ar', 'an', 'hy', 'as', 'av', 'ae', 'ay',
    'az', 'bm', 'ba', 'eu', 'be', 'bn', 'bh', 'bi', 'bs', 'br', 'bg', 'my', 'ca',
    'ch', 'ce', 'ny', 'zh', 'cv', 'kw', 'co', 'cr', 'hr', 'cs', 'da', 'dv', 'nl',
    'dz', 'en', 'eo', 'et', 'ee', 'fo', 'fj', 'fi', 'fr', 'ff', 'gl', 'ka', 'de',
    'el', 'gn', 'gu', 'ht', 'ha', 'he', 'hz', 'hi', 'ho', 'hu', 'ia', 'id', 'ie',
    'ga', 'ig', 'ik', 'io', 'is', 'it', 'iu', 'ja', 'jv', 'kl', 'kn', 'kr', 'ks',
    'kk', 'km', 'ki', 'rw', 'ky', 'kv', 'kg', 'ko', 'ku', 'kj', 'la', 'lb', 'lg',
    'li', 'ln', 'lo', 'lt', 'lu', 'lv', 'gv', 'mk', 'mg', 'ms', 'ml', 'mt', 'te',
    'mr', 'mh', 'mn', 'na', 'nv', 'nd', 'ne', 'ng', 'nb', 'nn', 'no', 'ii', 'nr',
    'oc', 'oj', 'cu', 'om', 'or', 'os', 'pa', 'pi', 'fa', 'pl', 'ps', 'pt', 'qu',
    'rm', 'rn', 'ro', 'ru', 'sa', 'sc', 'sd', 'se', 'sm', 'sg', 'sr', 'gd', 'sn',
    'si', 'sk', 'sl', 'st', 'es', 'su', 'sw', 'ss', 'sv', 'ta', 'tg', 'th', 'ti',
    'bo', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty', 'ug', 'uk', 'ur',
    'uz', 've', 'vi', 'vo', 'wa', 'cy', 'wo', 'fy', 'xh', 'yi', 'yo', 'za', 'zu'
];

export type UILanguage = 'fi' | 'en';

export const availableUILanguages: UILanguage[] = ['fi', 'en'];

export interface LanguageContext {
  id: Uri;
  language: Language[];
}

export interface Localizer {
  language: Language;
  context?: LanguageContext;
  translate(localizable: Localizable): string;
  getStringWithModelLanguageOrDefault(key: string|undefined|null, defaultLanguage: UILanguage): string;
  allUILocalizationsForKey(localizationKey: string): string[];
}
