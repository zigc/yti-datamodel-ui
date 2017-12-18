import { containsAny, collectProperties, index } from 'yti-common-ui/utils/array';
import { Destination, WithId } from 'app/types/entity';
import { areEqual, requireDefined, isDefined } from 'yti-common-ui/utils/object';
import { IHttpPromiseCallbackArg } from 'angular';
import { Uri, Urn, RelativeUrl } from 'app/entities/uri';
import { Coordinate, Dimensions } from 'app/types/visualization';
import { Model } from 'app/entities/model';
import { LegacyConcept, Concept } from 'app/entities/vocabulary';
import { ClassType, GroupType, ModelType, PredicateType, Type, GraphData, EntityConstructor } from 'app/types/entity';
import { firstMatchingValue } from 'yti-common-ui/utils/array';

const fromType = new Map<Type, string[]>();
const toType = new Map<string, Type>();

function registerType(type: Type, rdfTypes: string[]) {
  fromType.set(type, rdfTypes);
  for (const rdfType of rdfTypes) {
    toType.set(rdfType, type);
  }
}

registerType('class', ['rdfs:Class']);
registerType('shape', ['sh:Shape']);
registerType('attribute', ['owl:DatatypeProperty']);
registerType('association', ['owl:ObjectProperty']);
registerType('property', ['rdf:Property']);
registerType('model', ['owl:Ontology']);
registerType('profile', ['dcap:DCAP']);
registerType('group', ['foaf:Group']);
registerType('organization', ['foaf:Organization']);
registerType('library', ['dcap:MetadataVocabulary']);
registerType('constraint', ['sh:AbstractOrNodeConstraint', 'sh:AbstractAndNodeConstraint', 'sh:AbstractNotNodeConstraint']);
registerType('user', ['foaf:Person']);
registerType('concept', ['skos:Concept']);
registerType('material', ['termed:Graph']);
registerType('vocabulary', ['skos:ConceptScheme']);
registerType('entity', ['prov:Entity']);
registerType('activity', ['prov:Activity']);
registerType('resource', ['rdfs:Resource']);
registerType('collection', ['skos:Collection']);
registerType('standard', ['dcterms:Standard']);
registerType('referenceData', ['iow:FCodeScheme']);
registerType('externalReferenceData', ['dcam:VocabularyEncodingScheme']);
registerType('referenceDataGroup', ['iow:FCodeGroup']);
registerType('referenceDataCode', ['iow:FCode']);

export function mapType(type: string): Type|null {
  const result = toType.get(type);
  if (!result) {
    console.log('Unknown type not mapped', type);
  }
  return result || null;
}

export function reverseMapType(type: Type): string|null {
  const result = fromType.get(type);
  if (!result) {
    console.log('Unknown type not mapped: ' + type);
    return null;
  } else if (result.length !== 1) {
    throw new Error(`Cannot map '${type}' because is not bijection: '${result}'`);
  } else {
    return result[0];
  }
}

export function normalizeReferrerType(types: Type[]): Type|null {
  return normalizePredicateType(types) || normalizeClassType(types) || normalizeModelType(types) || normalizeGroupType(types);
}

export function normalizePredicateType(types: Type[]): PredicateType|null {
  return firstMatchingValue<Type>(['attribute', 'association', 'property'], types) as PredicateType;
}

export function normalizeClassType(types: Type[]): ClassType|null {
  return firstMatchingValue<Type>(['shape', 'class'], types) as ClassType;
}

export function normalizeModelType(types: Type[]): ModelType|null {
  const type = firstMatchingValue<Type>(['profile', 'library', 'model'], types) as ModelType;
  if (type === 'model') {
    return 'library';
  } else {
    return type;
  }
}

export function normalizeGroupType(types: Type[]): GroupType|null {
  return firstMatchingValue<Type>(types, ['group']) as GroupType;
}

export function modelUrl(prefix: string): RelativeUrl {
  return `/model/${prefix}` + '/';
}

export function resourceUrl(modelPrefix: string, resource: Uri|string) {
  if (typeof resource === 'string') {
    return modelUrl(modelPrefix) +  resource + '/';
  } else {
    const resolved = resource.resolve();
    const linked = resolved && resolved.prefix !== modelPrefix;
    return modelUrl(modelPrefix) +  (linked ? resource.curie : resource.name) + '/';
  }
}

export function contextlessInternalUrl(destination: Destination) {
  if (destination) {
    if (containsAny(destination.type, ['model', 'profile'])) {
      return modelUrl(requireDefined(destination.prefix));
    } else if (containsAny(destination.type, ['group'])) {
      return groupUrl(destination.id.uri);
    } else if (containsAny(destination.type, ['association', 'attribute', 'class', 'shape'])) {
      return resourceUrl(requireDefined(requireDefined(destination.definedBy).prefix), destination.id);
    } else {
      throw new Error('Unsupported type for url: ' + destination.type);
    }
  } else {
    return null;
  }
}

export function groupUrl(id: string): RelativeUrl {
  return `/group?id=${encodeURIComponent(id)}`;
}

export function idToIndexMap<T extends {id: Uri }>(items: T[]): Map<Urn, number> {
  return new Map(items.map<[string, number]>((item: T, index: number) => [item.id.toString(), index]));
}

export function isConcept(concept: Concept|LegacyConcept|null|undefined): concept is Concept {
  return isDefined(concept) && !concept.legacy;
}

export function resolveConceptConstructor(graph: any): EntityConstructor<Concept|LegacyConcept> {
  return graph.hasOwnProperty('graph') ? Concept : LegacyConcept;
}

export function coordinatesAreEqual(l: Coordinate|null|undefined, r: Coordinate|null|undefined) {
  // Coordinates seem to fluctuate a bit with jointjs and firefox so normalize by truncating decimals
  return areEqual(l, r, (lhs, rhs) => Math.trunc(lhs.x) === Math.trunc(rhs.x) && Math.trunc(lhs.y) === Math.trunc(rhs.y));
}

export function centerToPosition(center: Coordinate, dimensions: Dimensions): Coordinate {
  return { x: center.x - (dimensions.width / 2), y: center.y - (dimensions.height / 2) };
}

export function copyCoordinate(coordinate: Coordinate|null) {
  return coordinate ? { x: coordinate.x, y: coordinate.y } : null;
}

export function copyVertices(vertices: Coordinate[]) {
  return vertices.slice();
}

export function indexById<T extends WithId>(items: T[]): Map<string, T> {
  return index<T, string>(items, item => item.id.toString());
}

export function collectIds(items: WithId[]|WithId[][]): Set<string> {
  return collectProperties<WithId, string>(items, item => {
    return item.id.toString();
  });
}

export function expandContextWithKnownModels(model?: Model): (response: IHttpPromiseCallbackArg<GraphData>) => IHttpPromiseCallbackArg<GraphData> {
  return (response: IHttpPromiseCallbackArg<GraphData>) => {
    if (model) {
      model.expandContextWithKnownModels(response.data!['@context']);
    }
    return response;
  };
}

export function glyphIconClassForType(type: Type[]) {

  if (containsAny(type, ['class', 'shape'])) {
    return ['glyphicon', 'glyphicon-list-alt'];
  } else if (containsAny(type, ['attribute'])) {
    return ['glyphicon', 'glyphicon-tasks'];
  } else if (containsAny(type, ['association'])) {
    return ['glyphicon', 'glyphicon-sort'];
  } else if (containsAny(type, ['model', 'profile'])) {
    return ['glyphicon', 'glyphicon-book'];
  } else if (containsAny(type, ['concept', 'conceptSuggestion'])) {
    return ['fa', 'fa-lightbulb-o'];
  } else if (!type || type.length === 0 || (type.length === 1 && containsAny(type, ['property']))) {
    return ['glyphicon', 'glyphicon-question-sign'];
  } else {
    return [];
  }
}

export const glyphIconClassUnknown = ['glyphicon', 'glyphicon-question-sign'];
