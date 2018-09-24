import { lowerCaseFirst, upperCaseFirst } from 'change-case';
import { ClassDetails, PredicateDetails } from 'app/services/entityLoader';
import { Language } from 'app/types/language';
import { KnownPredicateType } from 'app/types/entity';

const baseNamespace = 'http://uri.suomi.fi/';
const dataModelNamespace = `${baseNamespace}datamodel/`;
const terminologyNamespace = `${baseNamespace}terminology/`;

function normalizeAsId(resourceName: string) {
  return resourceName
    .replace(/\s/g, '')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ä/g, 'a')
    .replace(/Ä/g, 'A')
    .replace(/å/g, 'a')
    .replace(/Å/g, 'A');
}

export function vocabularyIdFromPrefix(prefix: string) {
  return `${terminologyNamespace}${prefix}/terminological-vocabulary-1`;
}

export function conceptIdFromPrefixAndIndex(prefix: string, index: number) {
  return `${terminologyNamespace}${prefix}/concept-${index + 1}`;
}

export function modelIdFromPrefix(modelPrefix: string) {
  return `${dataModelNamespace}ns/${modelPrefix}`
}

export function classNameToResourceIdName(className: string) {
  return normalizeAsId(upperCaseFirst(className));
}

export function predicateNameToResourceIdName(predicateName: string) {
  return normalizeAsId(lowerCaseFirst(predicateName));
}

export function classIdFromNamespaceId(namespaceId: string, name: string) {
  return namespaceId + '#' + classNameToResourceIdName(name);
}

export function classIdFromPrefixAndName(prefix: string, name: string) {
  return classIdFromNamespaceId(modelIdFromPrefix(prefix), name);
}

export function classIdAndNameFromHelpData(data: { prefix: string, details: ClassDetails }, lang: Language) {
  return {
    id: data.details.id || classIdFromPrefixAndName(data.prefix, data.details.label.fi),
    name: data.details.label[lang]
  };
}

export function predicateIdFromNamespaceId(namespaceId: string, name: string) {
  return namespaceId + '#' + predicateNameToResourceIdName(name);
}

export function predicateIdFromPrefixAndName(prefix: string, name: string) {
  return predicateIdFromNamespaceId(modelIdFromPrefix(prefix), name);
}

export function predicateIdAndNameFromHelpData(data: { type: KnownPredicateType, prefix: string, details: PredicateDetails }, lang: Language) {
  return {
    id: data.details.id || predicateIdFromPrefixAndName(data.prefix, data.details.label.fi),
    name: data.details.label[lang]
  };
}
