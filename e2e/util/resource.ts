import { lowerCaseFirst, upperCaseFirst } from 'change-case';
import { defaultModelNamespace } from '../../src/config';
import { ClassType, KnownPredicateType } from '../../src/app/types/entity';
import { assertNever } from 'yti-common-ui/utils/object';

export interface FromConceptSuggestion {
  type: 'conceptSuggestion',
  name: string
}

export interface FromExistingConcept {
  type: 'existingConcept',
  name: string,
  conceptId: string
}

export interface FromExistingResource {
  type: 'existingResource',
  name: string,
  id: string
}

export interface FromExternalResource {
  type: 'externalResource',
  name: string,
  id: string
}

export type AddResourceParameters = FromConceptSuggestion
                                  | FromExistingConcept
                                  | FromExistingResource
                                  | FromExternalResource;

export function fromConceptSuggestion(params: { name: string }): FromConceptSuggestion {
  return { type: 'conceptSuggestion', name: params.name };
}

export function fromExistingConcept(params: { name: string, conceptId: string }): FromExistingConcept {
  return { type: 'existingConcept', name: params.name, conceptId: params.conceptId };
}

export function fromExistingResource(params: { name: string, id: string }): FromExistingResource {
  return { type: 'existingResource', name: params.name, id: params.id };
}

export function fromExternalResource(params: { name: string, id: string }): FromExternalResource {
  return { type: 'externalResource', name: params.name, id: params.id };
}

export interface ResourceDescriptor<T> {
  origin: AddResourceParameters;
  type: T;
}

export type PropertyDescriptor = ResourceDescriptor<KnownPredicateType>;

export type PredicateDescriptor = ResourceDescriptor<KnownPredicateType>;

export interface ClassDescriptor extends ResourceDescriptor<ClassType> {
  properties?: ResourceDescriptor<KnownPredicateType>[];
}

export function modelIdFromPrefix(modelPrefix: string) {
  return defaultModelNamespace(modelPrefix);
}

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

export function classNameToResourceIdName(className: string) {
  return normalizeAsId(upperCaseFirst(className));
}

export function predicateNameToResourceIdName(predicateName: string) {
  return normalizeAsId(lowerCaseFirst(predicateName));
}

export function resourceNameToResourceIdName(type: ClassType|KnownPredicateType, resourceName: string) {
  switch (type) {
    case 'class':
    case 'shape':
      return classNameToResourceIdName(resourceName);
    case 'attribute':
    case 'association':
      return predicateNameToResourceIdName(resourceName);
    default:
      return assertNever(type);
  }
}

export function resourceIdFromNamespaceId(type: ClassType|KnownPredicateType, namespaceId: string, resourceName: string) {
  return namespaceId + '#' + resourceNameToResourceIdName(type, resourceName);
}

export function classIdFromNamespaceId(namespaceId: string, className: string) {
  return namespaceId + '#' + classNameToResourceIdName(className);
}

export function predicateIdFromNamespaceId(namespaceId: string, predicateName: string) {
  return namespaceId + '#' + predicateNameToResourceIdName(predicateName);
}

export function resourceIdFromPrefix(type: ClassType|KnownPredicateType, modelPrefix: string, resourceName: string) {
  return resourceIdFromNamespaceId(type, modelIdFromPrefix(modelPrefix), resourceName);
}

export function predicateIdFromPrefix(modelPrefix: string, predicateName: string) {
  return predicateIdFromNamespaceId(modelIdFromPrefix(modelPrefix), predicateName);
}

export function classIdFromPrefix(modelPrefix: string, className: string) {
  return classIdFromNamespaceId(modelIdFromPrefix(modelPrefix), className);
}

export function resolveResourceId(modelPrefix: string, resource: ResourceDescriptor<any>): string {
  switch (resource.origin.type) {
    case 'conceptSuggestion':
    case 'existingConcept':
      return resourceIdFromPrefix(resource.type, modelPrefix, resource.origin.name);
    case 'existingResource':
      if (resource.type === 'shape') {
        return resourceIdFromPrefix(resource.type, modelPrefix, resource.origin.name);
      } else {
        return resource.origin.id;
      }
    case 'externalResource':
      return resource.origin.id;
    default:
      return assertNever(resource.origin);
  }
}
