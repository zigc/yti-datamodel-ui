import IPromise = angular.IPromise;
import * as _ from 'lodash';
import * as frames from './frames';
import * as moment from 'moment';
import Moment = moment.Moment;
import { Frame } from './frames';
import { mapType, reverseMapType } from './typeMapping';
import { config } from '../config';
import { Uri, Url, Urn, RelativeUrl } from './uri';
import { comparingDate, comparingNumber } from './comparators';
import { DataType } from './dataTypes';
import { Language, hasLocalization, createConstantLocalizable } from '../utils/language';
import { containsAny, normalizeAsArray, swapElements, contains } from '../utils/array';
import { glyphIconClassForType } from '../utils/entity';
import {
  normalizeModelType, normalizeSelectionType, normalizeClassType, normalizePredicateType,
  normalizeReferrerType
} from '../utils/type';
import { identity } from '../utils/function';
// TODO entities should not depend on services
import { Localizer } from './languageService';
import gettextCatalog = angular.gettext.gettextCatalog;
import { isDefined } from '../utils/object';

const jsonld: any = require('jsonld');

const isoDateFormat = 'YYYY-MM-DDTHH:mm:ssz';

export interface EditableEntity {
  id: Uri;
  label: Localizable;
  normalizedType: Type;
  isOfType(type: Type): boolean;
  unsaved: boolean;
  clone<T>(): T;
  serialize<T>(): T;
}

export type Localizable = { [language: string]: string; }
export type UserLogin = string;

export type Concept = FintoConcept|ConceptSuggestion;

export type Type = 'class'
                 | 'shape'
                 | 'attribute'
                 | 'association'
                 | 'property'
                 | 'model'
                 | 'profile'
                 | 'group'
                 | 'library'
                 | 'constraint'
                 | 'user'
                 | 'concept'
                 | 'conceptSuggestion'
                 | 'entity'
                 | 'activity'
                 | 'resource'
                 | 'collection'
                 | 'vocabulary'
                 | 'standard'
                 | 'referenceData'
                 | 'externalReferenceData'
                 | 'referenceDataGroup'
                 | 'referenceDataCode';

export type State = 'Unstable'
                  | 'Draft'
                  | 'Recommendation'
                  | 'Deprecated';

export type ConstraintType = 'or'
                           | 'and'
                           | 'not';

export type GraphData = {
  '@context': any;
  '@graph': any;
}

interface EntityConstructor<T extends GraphNode> {
  new(graph: any, context: any, frame: any): T;
}

type EntityFactory<T extends GraphNode> = (framedData: any) => EntityConstructor<T>;

export function isLocalizable(obj: any): obj is Localizable {
  return typeof obj === 'object';
}

export class ExternalEntity {
  constructor(public language: Language, public label: string, public type: Type, public id?: Uri) {
  }

  get normalizedType() {
    return this.type;
  }
}

export interface LanguageContext {
  id: Uri;
  language: Language[];
}

export abstract class GraphNode {

  type: Type[];

  constructor(public graph: any, public context: any, public frame: any) {
    this.type = mapGraphTypeObject(graph);
  }

  isOfType(type: Type) {
    return containsAny(this.type, [type]);
  }

  get glyphIconClass(): any {
    return glyphIconClassForType(this.type);
  }

  serializationValues(clone: boolean): {} {
    return {};
  }

  serialize(inline: boolean = false, clone: boolean = false): any {
    const values = Object.assign(this.graph, this.serializationValues(clone));

    if (inline) {
      return values;
    } else {
      return {
        '@graph': values,
        '@context': this.context
      };
    }
  }
}

export class DefinedBy extends GraphNode {

  id: Uri;
  label: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);

    if (typeof graph === 'string' || graph instanceof String) {
      const str = (graph instanceof String) ? graph.valueOf() : graph;
      this.id = new Uri(str, context);
      this.label = createConstantLocalizable(this.id.uri);

    } else if (typeof graph === 'object') {
      this.id = new Uri(graph['@id'], context);
      this.label = deserializeLocalizable(graph.label);
    } else {
      throw new Error('Unsupported is defined sub-graph');
    }
  }
}

export abstract class AbstractGroup extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  homepage: Url;
  normalizedType: Type = 'group';
  selectionType: Type = 'group';

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.homepage = graph.homepage;
  }

  get groupId() {
    return this.id;
  }

  iowUrl(href: boolean) {
    return internalUrl(this.id, this.type, href);
  }
}

export class GroupListItem extends AbstractGroup {
  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }
}

export class Group extends AbstractGroup {

  unsaved: boolean;
  language: Language[] = ['fi', 'en'];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }

  clone(): Group {
    const serialization = this.serialize(false, true);
    const result =  new Group(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    return result;
  }
}

abstract class AbstractModel extends GraphNode {

  id: Uri;
  label: Localizable;
  normalizedType: Type;
  selectionType: Type;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.normalizedType = normalizeModelType(this.type);
    this.selectionType = normalizeSelectionType(this.type);
  }

  iowUrl(href: boolean) {
    return internalUrl(this.id, this.type, href);
  }
}

export class ModelListItem extends AbstractModel {
  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }
}

export class Model extends AbstractModel {

  comment: Localizable;
  state: State;
  vocabularies: ImportedVocabulary[];
  namespaces: ImportedNamespace[];
  links: Link[];
  referenceDatas: ReferenceData[];
  unsaved: boolean = false;
  namespace: Url;
  prefix: string;
  group: GroupListItem;
  version: Urn;
  rootClass: Uri;
  language: Language[];
  modifiedAt: Moment;
  createdAt: Moment;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.comment = deserializeLocalizable(graph.comment);
    this.state = graph.versionInfo;
    this.namespace = graph['preferredXMLNamespaceName'];
    this.prefix = graph['preferredXMLNamespacePrefix'];
    if (!graph.isPartOf['@type']) {
      // TODO: Shouldn't be needed but in all cases API doesn't return it
      graph.isPartOf['@type'] = 'foaf:Group';
    }
    this.group = new GroupListItem(graph.isPartOf, context, frame);
    this.vocabularies = deserializeEntityList(graph.references, context, frame, () => ImportedVocabulary);
    this.namespaces = deserializeEntityList(graph.requires, context, frame, () => ImportedNamespace);
    this.links = deserializeEntityList(graph.relations, context, frame, () => Link);
    this.referenceDatas = deserializeEntityList(graph.codeLists, context, frame, () => ReferenceData);
    this.version = graph.identifier;
    if (graph.rootResource) {
      this.rootClass = new Uri(graph.rootResource, context);
    }
    this.language = deserializeList<Language>(graph.language || ['fi', 'en']);
    this.modifiedAt = deserializeOptional(graph.modified, deserializeDate);
    this.createdAt = deserializeDate(graph.created);
    this.copyNamespacesFromRequires();
  }

  get groupId() {
    return this.group.id;
  }

  addVocabulary(vocabulary: ImportedVocabulary) {
    this.vocabularies.push(vocabulary);
  }

  removeVocabulary(vocabulary: ImportedVocabulary) {
    _.remove(this.vocabularies, vocabulary);
  }

  addNamespace(ns: ImportedNamespace) {
    this.namespaces.push(ns);
  }

  removeNamespace(ns: ImportedNamespace) {
    if (ns.namespaceType !== NamespaceType.TECHNICAL) {
      delete this.context[ns.prefix];
    }
    _.remove(this.namespaces, ns);
  }

  addLink(link: Link) {
    this.links.push(link);
  }

  removeLink(link: Link) {
    _.remove(this.links, link);
  }

  addReferenceData(referenceData: ReferenceData) {
    this.referenceDatas.push(referenceData);
  }

  removeReferenceData(referenceData: ReferenceData) {
    _.remove(this.referenceDatas, referenceData);
  }

  getNamespaceNames(exclude?: ImportedNamespace): Set<string> {
    const namespaceNames = new Set<string>();

    for (const namespace of this.getNamespaces()) {
      if (!exclude || exclude.namespace !== namespace.url) {
        namespaceNames.add(namespace.url);
      }
    }

    return namespaceNames;
  }

  getPrefixNames(exclude?: ImportedNamespace): Set<string> {
    const prefixNames = new Set<string>();

    for (const namespace of this.getNamespaces()) {
      if (!exclude || exclude.prefix !== namespace.prefix) {
        prefixNames.add(namespace.prefix);
      }
    }

    return prefixNames;
  }

  getNamespaces() {
    const namespaces: Namespace[] = [];
    const requiredNamespacePrefixes = new Set<string>();

    namespaces.push(new Namespace(this.prefix, this.namespace, NamespaceType.MODEL));
    requiredNamespacePrefixes.add(this.prefix);

    for (const require of this.namespaces) {
      namespaces.push(new Namespace(require.prefix, require.namespace, require.namespaceType));
      requiredNamespacePrefixes.add(require.prefix);
    }

    for (const prefix of Object.keys(this.context)) {
      if (!requiredNamespacePrefixes.has(prefix)) {
        const value = this.context[prefix];
        if (typeof value === 'string') {
          namespaces.push(new Namespace(prefix, value, NamespaceType.IMPLICIT_TECHNICAL));
        }
      }
    }

    return namespaces;
  }

  getNamespacesOfType(...namespaceTypes: NamespaceType[]) {
    const result: {[prefix: string]: string} = {};

    for (const namespace of this.getNamespaces()) {
      if (_.contains(namespaceTypes, namespace.type)) {
        result[namespace.prefix] = namespace.url;
      }
    }

    return result;
  }

  private copyNamespacesFromRequires() {
    for (const require of this.namespaces) {
      // if overriding existing namespace remove previous prefix
      for (const prefix of Object.keys(this.context)) {
        const value = this.context[prefix];
        if (value === require.namespace) {
          delete this.context[prefix];
        }
      }
      this.context[require.prefix] = require.namespace;
    }
  }

  expandContextWithKnownModels(context: any) {
    Object.assign(context, this.getNamespacesOfType(NamespaceType.MODEL, NamespaceType.EXTERNAL));
  }

  asDefinedBy() {
    return new DefinedBy({'@id': this.id.uri, '@type': reverseMapTypeObject(this.type), label: this.label}, this.context, this.frame);
  }

  namespaceAsDefinedBy(ns: Url) {
    for (const require of this.namespaces) {
      if (ns === require.namespace) {
        return new DefinedBy({'@id': ns, '@type': reverseMapTypeObject(require.type)}, this.context, this.frame);
      }
    }
    throw new Error('Namespace not found: ' + ns);
  }

  isNamespaceKnownToBeNotModel(namespace: Url) {
    return this.isNamespaceKnownAndOfType(namespace, [NamespaceType.EXTERNAL, NamespaceType.TECHNICAL, NamespaceType.IMPLICIT_TECHNICAL]);
  }

  isNamespaceKnownToBeModel(namespace: Url) {
    return this.isNamespaceKnownAndOfType(namespace, [NamespaceType.MODEL]);
  }

  isNamespaceKnownAndOfType(namespace: Url, types: NamespaceType[])  {
    for (const knownNamespace of this.getNamespaces()) {
      if (namespace === knownNamespace.url && containsAny(types, [knownNamespace.type])) {
        return true;
      }
    }
    return false;
  }

  linkTo(destination: Destination, href: boolean) {
    if (destination) {
      const id = destination.id;
      const typeArray: Type[] = normalizeAsArray<Type>(destination.type);

      if (id && !id.isUrn()) {
        return this.isNamespaceKnownToBeModel(id.namespace) ? internalUrl(id, typeArray, href) : id.url;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  clone(): Model {
    const serialization = this.serialize(false, true);
    const result = new Model(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    return result;
  }

  serializationValues(clone: boolean): {} {
    this.copyNamespacesFromRequires();

    return {
      '@id': this.id.uri,
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      versionInfo: this.state,
      references: serializeEntityList(this.vocabularies, clone),
      requires: serializeEntityList(this.namespaces, clone),
      relations: serializeEntityList(this.links, clone),
      codeLists: serializeEntityList(this.referenceDatas, clone),
      identifier: this.version,
      rootResource: this.rootClass && this.rootClass.uri,
      language: serializeList(this.language),
      created: serializeDate(this.createdAt),
      modified: serializeDate(this.modifiedAt)
    };
  }
}

export interface Destination {
  id: Uri;
  type?: Type|Type[];
}

export enum NamespaceType {
  IMPLICIT_TECHNICAL, TECHNICAL, MODEL, EXTERNAL
}

export class Namespace {
  constructor(public prefix: string, public url: string, public type: NamespaceType) {
  }
}

export class Link extends GraphNode {

  homepage: Uri;
  title: Localizable;
  description: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.homepage = graph.homepage && new Uri(graph.homepage);
    this.title = deserializeLocalizable(graph.title);
    this.description = deserializeLocalizable(graph.description);
  }

  serializationValues(): any {
    return {
      homepage: this.homepage.uri,
      title: serializeLocalizable(this.title),
      description: serializeLocalizable(this.description)
    };
  }
}

export class Vocabulary extends GraphNode {

  id: string;
  label: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = graph.id;
    this.label = graph.label;
  }
}

export class ImportedVocabulary extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  vocabularyId: string;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.vocabularyId = graph.identifier;
    this.id = new Uri(graph['@id']);
    this.label = deserializeLocalizable(graph.title);
    this.comment = deserializeLocalizable(graph.comment);
  }

  get local() {
    return this.isOfType('collection');
  }

  get href() {
    return config.fintoUrl + this.vocabularyId;
  }
}

export class ImportedNamespace extends GraphNode {

  id: Uri;
  label: Localizable;
  private _prefix: string;
  private _namespace: Url;
  namespaceType: NamespaceType;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this._namespace = graph.preferredXMLNamespaceName;
    this.prefix = graph.preferredXMLNamespacePrefix;

    if (this.isOfType('resource')) {
      this.namespaceType = NamespaceType.EXTERNAL;
    } else if (this.isOfType('standard')) {
      this.namespaceType = NamespaceType.TECHNICAL;
    } else {
      this.namespaceType = NamespaceType.MODEL;
    }
  }

  get external() {
    return this.namespaceType === NamespaceType.EXTERNAL;
  }

  get technical() {
    return this.namespaceType === NamespaceType.TECHNICAL;
  }

  get prefixModifiable() {
    return this.external;
  }

  get namespaceModifiable() {
    return this.external;
  }

  get labelModifiable() {
    return this.external || this.technical;
  }

  get prefix() {
    return this._prefix;
  }

  set prefix(prefix) {
    this._prefix = prefix;
    this.id = new Uri(this.id.uri, { [prefix]: this.namespace });
  }

  get namespace() {
    return this._namespace;
  }

  set namespace(ns) {
    this._namespace = ns;
    this.id = new Uri(_.trimRight(ns, '#/'), { [this.prefix]: ns });
  }

  serializationValues(clone: boolean): {} {
    return {
      '@id': this.id.uri,
      label: serializeLocalizable(this.label),
      preferredXMLNamespaceName: this.namespace,
      preferredXMLNamespacePrefix: this.prefix
    };
  }
}

export class ReferenceDataServer extends GraphNode {
  id: Uri;
  identifier: string;
  description: Localizable;
  title: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id']);
    this.identifier = graph.identifier;
    this.description = deserializeLocalizable(graph.description);
    this.title = deserializeLocalizable(graph.title);
  }
}

export class ReferenceDataGroup extends GraphNode {
  id: Uri;
  title: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id']);
    this.title = deserializeLocalizable(graph.title);
  }
}

export class ReferenceData extends GraphNode {

  id: Uri;
  title: Localizable;
  description: Localizable;
  creator: string;
  identifier: string;
  groups: ReferenceDataGroup[];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id']);
    this.title = deserializeLocalizable(graph.title);
    this.description = deserializeLocalizable(graph.description);
    this.creator = graph.creator;
    this.identifier = graph.identifier;
    this.groups = deserializeEntityList(graph.isPartOf, context, frame, () => ReferenceDataGroup);
  }

  isExternal() {
    return this.isOfType('externalReferenceData');
  }

  serializationValues(clone: boolean): {} {
    return {
      '@id': this.id.uri,
      title: serializeLocalizable(this.title),
      description: serializeLocalizable(this.description),
      identifier: this.identifier
    };
  }
}

export class ReferenceDataCode extends GraphNode {

  id: Uri;
  title: Localizable;
  identifier: string;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id']);
    this.title = deserializeLocalizable(graph.title);
    this.identifier = graph.identifier;
  }
}

export abstract class AbstractClass extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  selectionType: Type;
  normalizedType: Type;
  definedBy: DefinedBy;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.selectionType = normalizeSelectionType(this.type);
    this.normalizedType = normalizeClassType(this.type);
    // TODO: remove this if when externalClass API is fixed to return it
    if (graph.isDefinedBy) {
      this.definedBy = new DefinedBy(graph.isDefinedBy, context, frame);
    }
  }

  isClass() {
    return true;
  }

  isPredicate() {
    return false;
  }

  iowUrl(href: boolean) {
    return internalUrl(this.id, this.type, href);
  }

  isSpecializedClass() {
    return this.definedBy.isOfType('profile');
  }
}

export class ClassListItem extends AbstractClass {

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }
}

export interface VisualizationClass {

  id: Uri;
  label: Localizable;
  scopeClass: Uri;
  properties: Property[];
  resolved: boolean;
  associationPropertiesWithTarget: Property[];
  hasAssociationTarget(id: Uri): boolean;
}

export class DefaultVisualizationClass extends GraphNode implements VisualizationClass {

  id: Uri;
  label: Localizable;
  scopeClass: Uri;
  properties: Property[];
  resolved = true;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.scopeClass = deserializeOptional(graph.scopeClass, scopeClass => new Uri(scopeClass, context));
    this.properties = deserializeEntityList(graph.property, context, frame, () => Property);
  }

  get associationPropertiesWithTarget() {
    return _.filter(this.properties, property => property.isAssociation() && property.valueClass);
  }

  hasAssociationTarget(id: Uri) {
    for (const association of this.associationPropertiesWithTarget) {
      if (association.valueClass.equals(id)) {
        return true;
      }
    }
    return false;
  }
}

export class AssociationTargetPlaceholderClass implements VisualizationClass {

  label: Localizable;
  properties: Property[] = [];
  resolved = false;
  scopeClass: Uri = null;
  associationPropertiesWithTarget: Property[] = [];

  constructor(public id: Uri, model: Model) {
    this.label = createConstantLocalizable(id.compact, model.language);
  }

  hasAssociationTarget(id: Uri) {
    return false;
  }
}

export class Class extends AbstractClass implements VisualizationClass {

  subClassOf: Uri;
  scopeClass: Uri;
  state: State;
  properties: Property[];
  subject: Concept;
  equivalentClasses: Uri[];
  constraint: Constraint;
  version: Urn;
  editorialNote: Localizable;
  modifiedAt: Moment;
  createdAt: Moment;

  resolved = true;
  unsaved: boolean = false;
  external: boolean = false;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);

    this.subClassOf = deserializeOptional(graph.subClassOf, subClassOf => new Uri(subClassOf, context));
    this.scopeClass = deserializeOptional(graph.scopeClass, scopeClass => new Uri(scopeClass, context));
    this.state = graph.versionInfo;

    this.properties = deserializeEntityList(graph.property, context, frame, () => Property)
      .sort(comparingNumber<Property>(property => property.index));

    // normalize indices
    for (let i = 0; i < this.properties.length; i++) {
      this.properties[i].index = i;
    }

    this.subject = deserializeOptional(graph.subject, (data) => deserializeEntity(data, context, frame, resolveConceptConstructor));
    this.equivalentClasses = deserializeList(graph.equivalentClass, equivalentClass => new Uri(equivalentClass, context));
    this.constraint = new Constraint(graph.constraint || {}, context, frame);
    this.version = graph.identifier;
    this.editorialNote = deserializeLocalizable(graph.editorialNote);
    this.modifiedAt = deserializeOptional(graph.modified, deserializeDate);
    this.createdAt = deserializeDate(graph.created);
  }

  get inUnstableState(): boolean {
    return this.state === 'Unstable';
  }

  movePropertyUp(property: Property) {
    this.swapProperties(property.index, property.index - 1);
  }

  movePropertyDown(property: Property) {
    this.swapProperties(property.index, property.index + 1);
  }

  private swapProperties(index1: number, index2: number) {
    swapElements(this.properties, index1, index2, (property, index) => property.index = index);
  }

  addProperty(property: Property): void {
    property.index = this.properties.length;
    this.properties.push(property);
  }

  removeProperty(property: Property): void {
    _.remove(this.properties, property);
  }

  get associationPropertiesWithTarget() {
    return _.filter(this.properties, property => property.isAssociation() && property.valueClass);
  }

  hasAssociationTarget(id: Uri) {
    for (const association of this.associationPropertiesWithTarget) {
      if (association.valueClass.equals(id)) {
        return true;
      }
    }
    return false;
  }

  clone(): Class {
    const serialization = this.serialize(false, true);
    const result = new Class(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    result.external = this.external;
    return result;
  }

  serializationValues(clone: boolean): {} {
    const isConstraintDefined = (constraint: Constraint) => constraint.items.length > 0 || hasLocalization(constraint.comment);

    return {
      '@id': this.id.uri,
      '@type': reverseMapTypeObject(this.type),
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      subClassOf: this.subClassOf && this.subClassOf.uri,
      scopeClass: this.scopeClass && this.scopeClass.uri,
      versionInfo: this.state,
      isDefinedBy: this.definedBy.serialize(true),
      property: serializeEntityList(this.properties, clone),
      subject: serializeOptional(this.subject, (data) => serializeEntity(data, clone)),
      equivalentClass: serializeList(this.equivalentClasses, equivalentClass => equivalentClass.uri),
      constraint: serializeOptional(this.constraint, isConstraintDefined, (data) => serializeEntity(data, clone)),
      identifier: this.version,
      editorialNote: serializeLocalizable(this.editorialNote),
      created: serializeDate(this.createdAt),
      modified: serializeDate(this.modifiedAt)
    };
  }
}

export class Constraint extends GraphNode {

  constraint: ConstraintType;
  items: ConstraintListItem[];
  comment: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);

    const and = deserializeEntityList(graph.and, context, frame, () => ConstraintListItem);
    const or = deserializeEntityList(graph.or, context, frame, () => ConstraintListItem);
    const not = deserializeEntityList(graph.not, context, frame, () => ConstraintListItem);

    if (and.length > 0) {
      this.constraint = 'and';
      this.items = and;
    } else if (or.length > 0) {
      this.constraint = 'or';
      this.items = or;
    } else if (not.length > 0) {
      this.constraint = 'not';
      this.items = not;
    } else {
      this.constraint = 'or';
      this.items = [];
    }

    this.comment = deserializeLocalizable(graph.comment);
  }

  isVisible() {
    return this.items.length > 0 || hasLocalization(this.comment);
  }

  addItem(shape: Class) {
    const graph = {
      '@id': shape.id.uri,
      label: shape.label
    };

    this.items.push(new ConstraintListItem(graph, this.context, this.frame));
  }

  removeItem(removedItem: ConstraintListItem) {
    _.remove(this.items, item => item === removedItem);
  }

  serializationValues(clone: boolean): {} {
    function mapConstraintType(constraint: ConstraintType) {
      switch (constraint) {
        case 'or':
          return 'sh:AbstractOrNodeConstraint';
        case 'and':
          return 'sh:AbstractAndNodeConstraint';
        case 'not':
          return 'sh:AbstractNotNodeConstraint';
        default:
          throw new Error('Unsupported constraint: ' + constraint);
      }
    }

    const items = serializeEntityList(this.items, clone);

    return {
      '@type': mapConstraintType(this.constraint),
      comment: serializeLocalizable(this.comment),
      and: this.constraint === 'and' ? items && serializeList(items) : null,
      or: this.constraint === 'or' ? items && serializeList(items) : null,
      not: this.constraint === 'not' ? items && serializeList(items) : null
    };
  }
}

export class ConstraintListItem extends GraphNode {

  shapeId: Uri;
  label: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.shapeId = new Uri(graph['@id'], context);
    this.label = graph.label;
  }

  serializationValues(clone: boolean): {} {
    return {
      '@id': this.shapeId.uri
    };
  }
}

export class Property extends GraphNode {

  internalId: Uri;
  externalId: string;
  state: State;
  label: Localizable;
  comment: Localizable;
  example: string;
  defaultValue: string;
  dataType: DataType;
  valueClass: Uri;
  predicate: Uri|Predicate;
  index: number;
  minCount: number;
  maxCount: number;
  minLength: number;
  maxLength: number;
  in: string[];
  hasValue: string;
  pattern: string;
  referenceData: ReferenceData[];
  predicateType: Type;
  classIn: Uri[];
  stem: Uri;
  editorialNote: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.internalId = new Uri(graph['@id'], context);
    this.externalId = graph['identifier'];
    this.state = graph.versionInfo;
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.example = graph.example;
    this.defaultValue = graph.defaultValue;
    this.dataType = graph.datatype;
    this.classIn = deserializeList(graph.classIn, klass => new Uri(klass, context));
    this.referenceData = deserializeEntityList(graph.memberOf, context, frame, () => ReferenceData);

    if (graph.type) {
      this.predicateType = mapType(graph.type);
    }

    if (graph.valueShape) {
      this.valueClass = new Uri(graph.valueShape, context);
    }

    if (typeof graph.predicate === 'object') {
      const types = mapGraphTypeObject(graph.predicate);

      if (containsAny(types, ['association'])) {
        this.predicate = new Association(graph.predicate, context, frame);
      } else if (containsAny(types, ['attribute'])) {
        this.predicate = new Attribute(graph.predicate, context, frame);
      } else {
        throw new Error('Incompatible predicate type: ' + types.join());
      }
    } else if (typeof graph.predicate === 'string') {
      this.predicate = new Uri(graph.predicate, context);
    } else {
      throw new Error('Unsupported predicate: ' + graph.predicate);
    }

    this.index = graph.index;
    this.minCount = graph.minCount;
    this.maxCount = graph.maxCount;
    this.minLength = graph.minLength;
    this.maxLength = graph.maxLength;
    this.in = deserializeList<string>(graph.inValues);
    this.hasValue = graph.hasValue;
    this.pattern = graph.pattern;
    this.stem = deserializeOptional(graph.stem, stem => new Uri(stem, context));
    this.editorialNote = deserializeLocalizable(graph.editorialNote);
  }

  get predicateId() {
    const predicate = this.predicate;
    if (predicate instanceof Predicate) {
      return predicate.id;
    } else if (predicate instanceof Uri) {
      return predicate;
    } else {
      throw new Error('Unsupported predicate: ' + predicate);
    }
  }

  get inputType(): DataType {
    if (this.dataType) {
      return this.dataType;
    } else {
      return 'xsd:anyURI';
    }
  }

  hasOptionalMetadata() {
    return this.externalId
      || this.example
      || this.in.length > 0
      || this.defaultValue
      || this.hasValue
      || this.pattern
      || this.minLength
      || this.maxLength
      || this.minCount
      || this.maxCount
      || this.referenceData.length > 0;
  }

  hasAssociationTarget() {
    return !!this.valueClass;
  }

  isAssociation() {
    return this.normalizedPredicateType === 'association';
  }

  isAttribute() {
    return this.normalizedPredicateType === 'attribute';
  }

  get inUnstableState(): boolean {
    return this.state === 'Unstable';
  }

  get normalizedPredicateType(): Type {
    if (this.predicateType) {
      return this.predicateType;
    } else {
      const predicate = this.predicate;
      if (predicate instanceof Predicate) {
        return predicate.normalizedType;
      } else {
        return this.dataType ? 'attribute' : this.valueClass ? 'association' : null;
      }
    }
  }

  get glyphIconClass() {
    const type = this.normalizedPredicateType;
    return glyphIconClassForType(type ? [type] : []);
  }

  clone(): Property {
    const serialization = this.serialize(false, true);
    return new Property(serialization['@graph'], serialization['@context'], this.frame);
  }

  serializationValues(clone: boolean): {} {

    const predicate = this.predicate;

    function serializePredicate() {
      if (predicate instanceof Predicate) {
        if (clone) {
          return predicate.serialize(clone);
        } else {
          return predicate.id.uri;
        }
      } else if (predicate instanceof Uri) {
        return predicate.uri;
      } else {
        throw new Error('Unsupported predicate: ' + predicate);
      }
    }

    return {
      '@id': this.internalId.uri,
      identifier: this.externalId,
      versionInfo: this.state,
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      example: this.example,
      defaultValue: this.defaultValue,
      datatype: this.dataType,
      valueShape: this.valueClass && this.valueClass.uri,
      predicate: serializePredicate(),
      index: this.index,
      minCount: this.minCount,
      maxCount: this.maxCount,
      minLength: this.minLength,
      maxLength: this.maxLength,
      inValues: serializeList(this.in),
      hasValue: this.hasValue,
      pattern: this.pattern,
      classIn: serializeList(this.classIn, classId => classId.uri),
      stem: serializeOptional(this.stem, stem => stem.uri),
      memberOf: serializeEntityList(this.referenceData, clone),
      editorialNote: serializeLocalizable(this.editorialNote)
    };
  }
}

export abstract class AbstractPredicate extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  definedBy: DefinedBy;
  normalizedType: Type;
  selectionType: Type;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
    this.definedBy = new DefinedBy(graph.isDefinedBy, context, frame);
    this.normalizedType = normalizePredicateType(this.type);
    this.selectionType = normalizeSelectionType(this.type);
  }

  isClass() {
    return false;
  }

  isPredicate() {
    return true;
  }

  isAttribute() {
    return this.isOfType('attribute');
  }

  isAssociation() {
    return this.isOfType('association');
  }

  iowUrl(href: boolean) {
    return internalUrl(this.id, this.type, href);
  }
}

export class PredicateListItem extends AbstractPredicate {

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }
}

export class Predicate extends AbstractPredicate {

  state: State;
  subPropertyOf: Uri;
  subject: Concept;
  equivalentProperties: Uri[];
  version: Urn;
  editorialNote: Localizable;
  modifiedAt: Moment;
  createdAt: Moment;

  unsaved: boolean = false;
  external: boolean = false;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.state = graph.versionInfo;
    if (graph.subPropertyOf) {
      this.subPropertyOf = new Uri(graph.subPropertyOf, context);
    }
    this.subject = deserializeOptional(graph.subject, (data) => deserializeEntity(data, context, frame, resolveConceptConstructor));
    this.equivalentProperties = deserializeList(graph.equivalentProperty, equivalentProperty => new Uri(equivalentProperty, context));
    this.version = graph.identifier;
    this.editorialNote = deserializeLocalizable(graph.editorialNote);
    this.modifiedAt = deserializeOptional(graph.modified, deserializeDate);
    this.createdAt = deserializeDate(graph.created);
  }

  get inUnstableState(): boolean {
    return this.state === 'Unstable';
  }

  serializationValues(clone: boolean): {} {
    return {
      '@id': this.id.uri,
      label: serializeLocalizable(this.label),
      comment: serializeLocalizable(this.comment),
      versionInfo: this.state,
      subPropertyOf: this.subPropertyOf && this.subPropertyOf.uri,
      subject: serializeOptional(this.subject, (data) => serializeEntity(data, clone)),
      equivalentProperty: serializeList(this.equivalentProperties, equivalentProperty => equivalentProperty.uri),
      identifier: this.version,
      editorialNote: serializeLocalizable(this.editorialNote),
      created: serializeDate(this.createdAt),
      modified: serializeDate(this.modifiedAt)
    };
  }
}

export class Association extends Predicate {

  valueClass: Uri;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    if (graph.range) {
      this.valueClass = new Uri(graph.range, context);
    }
  }

  clone(): Association {
    const serialization = this.serialize(false, true);
    const result = new Association(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    result.external = this.external;
    return result;
  }

  serializationValues(clone: boolean): {} {
    return Object.assign(super.serializationValues(clone), {
      range: this.valueClass && this.valueClass.uri
    });
  }
}

export class Attribute extends Predicate {

  dataType: DataType;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.dataType = graph.range;
  }

  clone(): Attribute {
    const serialization = this.serialize(false, true);
    const result = new Attribute(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    result.external = this.external;
    return result;
  }

  serializationValues(clone: boolean): {} {
    return Object.assign(super.serializationValues(clone), {
      range: this.dataType
    });
  }
}

export class FintoConcept extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  vocabularies: (ImportedVocabulary|Uri)[];
  broaderConcept: Concept;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.prefLabel);
    this.comment = deserializeLocalizable(graph.definition || graph.comment);
    this.vocabularies = deserializeList(graph.vocabularies, (data) => deserializeEntityOrId(data, context, frame, () => ImportedVocabulary));
    this.broaderConcept = deserializeOptional(graph.broaderConcept, (data) => deserializeEntity(data, context, frame, resolveConceptConstructor));
  }

  get unsaved() {
    return false;
  }

  get normalizedType(): Type {
    return 'concept';
  }

  get suggestion() {
    return false;
  }

  getVocabularyNames() {
    return _.map(this.vocabularies, vocabulary => new VocabularyNameHref(vocabulary));
  }

  clone(): FintoConcept {
    const serialization = this.serialize(false, true);
    return new FintoConcept(serialization['@graph'], serialization['@context'], this.frame);
  }
}

export class FintoConceptSearchResult extends GraphNode {
  id: Uri;
  label: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.prefLabel);
  }
}

export class ConceptSuggestion extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;
  vocabulary: ImportedVocabulary|Uri;
  definedBy: DefinedBy;
  broaderConcept: Concept;
  createdAt: Moment;
  creator: UserLogin;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.prefLabel);
    this.comment = deserializeLocalizable(graph.definition);
    this.vocabulary = deserializeEntityOrId(graph.inScheme, context, frame, () => ImportedVocabulary);
    this.definedBy = deserializeOptional(graph.isDefinedBy, (data) => deserializeEntity(data, context, frame, () => DefinedBy));
    this.broaderConcept = deserializeOptional(graph.broaderConcept, (data) => deserializeEntity(data, context, frame, resolveConceptConstructor));
    this.createdAt = deserializeDate(graph.atTime);
    this.creator = deserializeOptional(graph.wasAssociatedWith, deserializeUserLogin);
  }

  get unsaved() {
    return false;
  }

  get normalizedType(): Type {
    return 'conceptSuggestion';
  }

  get suggestion() {
    return true;
  }

  get vocabularies() {
    return [this.vocabulary];
  }

  getVocabularyNames() {
    return [new VocabularyNameHref(this.vocabulary)];
  }

  clone(): ConceptSuggestion {
    const serialization = this.serialize(false, true);
    return new ConceptSuggestion(serialization['@graph'], serialization['@context'], this.frame);
  }

  serializationValues(clone: boolean): {} {
    return {
      '@id': this.id.uri,
      prefLabel: serializeLocalizable(this.label),
      definition: serializeLocalizable(this.comment),
      inScheme: serializeEntityOrId(this.vocabulary, clone),
      isDefinedBy: serializeOptional(this.definedBy, data => serializeEntity(data, clone)),
      broaderConcept: serializeOptional(this.broaderConcept, data => serializeEntity(data, clone))
    };
  }
}

export class VocabularyNameHref {

  id: Uri;
  href: Url;
  name: string|Localizable;

  private static internalVocabularyName = 'Internal vocabulary';

  constructor(private vocabulary: ImportedVocabulary|Uri) {
    if (vocabulary instanceof Uri) {
      this.id = vocabulary;
      this.href = vocabulary.uri;
      this.name = vocabulary.uri;
    } else if (vocabulary instanceof ImportedVocabulary) {
      this.id = vocabulary.id;
      this.href = vocabulary.local ? null : vocabulary.href;
      this.name = vocabulary.label;
    } else {
      throw new Error('Unknown vocabulary type: ' + vocabulary);
    }
  }

  getLocalizedName(localizer: Localizer, gettextCatalog: gettextCatalog) {
    const name = this.name;

    if (isLocalizable(name)) {
      return localizer.translate(name);
    } else if (typeof name === 'string') {
      if (name === VocabularyNameHref.internalVocabularyName) {
        return gettextCatalog.getString(name);
      } else {
        return name;
      }
    } else {
      throw new Error('Unsupported name: ' + name);
    }
  }
}

export interface User {
  isLoggedIn(): boolean;
  isMemberOf(entity: AbstractModel|AbstractGroup): boolean;
  isMemberOfGroup(id: Uri): boolean;
  isAdminOf(entity: AbstractModel|AbstractGroup): boolean;
  isAdminOfGroup(id: Uri): boolean;
  name?: string;
}

export class DefaultUser extends GraphNode implements User {

  createdAt: Moment;
  modifiedAt: Moment;
  adminGroups: Uri[];
  memberGroups: Uri[];
  name: string;
  login: UserLogin;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.createdAt = deserializeDate(graph.created);
    this.modifiedAt = deserializeOptional(graph.modified, deserializeDate);
    this.adminGroups = deserializeList<Uri>(graph.isAdminOf, admin => new Uri(admin, context));
    this.memberGroups = deserializeList<Uri>(graph.isPartOf, part => new Uri(part, context));
    this.name = graph.name;
    this.login = deserializeUserLogin(graph['@id']);
  }

  isLoggedIn(): boolean {
    return this.graph['iow:login'];
  }

  isMemberOf(entity: Model|AbstractGroup) {
    return this.isMemberOfGroup(entity.groupId);
  }

  isMemberOfGroup(id: Uri) {
    return contains(this.memberGroups, id, (lhs, rhs) => lhs.equals(rhs));
  }

  isAdminOf(entity: Model|AbstractGroup) {
    return this.isAdminOfGroup(entity.groupId);
  }

  isAdminOfGroup(id: Uri) {
    return contains(this.adminGroups, id, (lhs, rhs) => lhs.equals(rhs));
  }
}

export class AnonymousUser implements User {
  isLoggedIn(): boolean {
    return false;
  }

  isMemberOf(entity: Model|AbstractGroup) {
    return false;
  }

  isMemberOfGroup(id: Uri) {
    return false;
  }

  isAdminOf(entity: Model|AbstractGroup) {
    return false;
  }

  isAdminOfGroup(id: Uri) {
    return false;
  }
}

export class SearchResult extends GraphNode {

  id: Uri;
  label: Localizable;
  comment: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.comment = deserializeLocalizable(graph.comment);
  }

  iowUrl(href: boolean) {
    return internalUrl(this.id, this.type, href);
  }
}

export interface Usage {
  id: Uri;
  label: Localizable;
  referrers: Referrer[];
}

export class DefaultUsage extends GraphNode implements Usage {

  id: Uri;
  label: Localizable;
  definedBy: DefinedBy;
  referrers: Referrer[];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.definedBy = deserializeOptional(graph.isDefinedBy, (data) => deserializeEntity(data, context, frame, () => DefinedBy));
    this.referrers = deserializeEntityList(graph.isReferencedBy, context, frame, () => Referrer);
  }
}

export class EmptyUsage implements Usage {

  id: Uri;
  label: Localizable;
  referrers: Referrer[] = [];

  constructor(entity: EditableEntity) {
    this.id = entity.id;
    this.label = entity.label;
  }
}

export class Referrer extends GraphNode {

  id: Uri;
  label: Localizable;
  definedBy: DefinedBy;
  normalizedType: Type;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.label = deserializeLocalizable(graph.label);
    this.definedBy = deserializeOptional(graph.isDefinedBy, (data) => deserializeEntity(data, context, frame, () => DefinedBy));
    this.normalizedType = normalizeReferrerType(this.type);
  }

  iowUrl(href: boolean) {
    return internalUrl(this.id, this.type, href);
  }
}

export class Activity extends GraphNode {

  id: Uri;
  createdAt: Moment;
  lastModifiedBy: UserLogin;
  versions: Entity[];
  latestVersion: Urn;
  private versionIndex: Map<Urn, number>;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = new Uri(graph['@id'], context);
    this.createdAt = deserializeDate(graph.startedAtTime);
    this.lastModifiedBy = deserializeUserLogin(graph.wasAttributedTo);
    this.versions = deserializeEntityList(graph.generated, context, frame, () => Entity).sort(comparingDate<Entity>(entity => entity.createdAt));
    this.versionIndex = indexById(this.versions);
    this.latestVersion = graph.used;
  }

  getVersion(version: Urn): Entity {
    const index = this.versionIndex.get(version);
    return index && this.versions[index];
  }

  get latest(): Entity {
    return this.getVersion(this.latestVersion);
  }
}

export class Entity extends GraphNode {

  id: Urn;
  createdAt: Moment;
  createdBy: UserLogin;
  previousVersion: Urn;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    this.id = graph['@id'];
    this.createdAt = deserializeDate(graph.generatedAtTime);
    this.createdBy = deserializeUserLogin(graph.wasAttributedTo);
    this.previousVersion = graph.wasRevisionOf;
  }

  getPrevious(activity: Activity): Entity {
    return this.previousVersion && activity.getVersion(this.previousVersion);
  }
}

function indexById<T extends {id: Urn}>(items: T[]): Map<Urn, number> {
  return new Map(items.map<[Urn, number]>((item: T, index: number) => [item.id, index]));
}

function resolveConceptConstructor(graph: any): EntityConstructor<Concept> {
  return isConceptSuggestionGraph(graph) ? ConceptSuggestion : FintoConcept;
}

function isConceptSuggestionGraph(withType: { '@type': string|string[] }) {
  return contains(mapGraphTypeObject(withType), 'conceptSuggestion');
}

function deserializeOptional<T>(data: any, deserializer: (data: any) => T) {
  return isDefined(data) ? deserializer(data) : null;
}

function serializeOptional<T>(data: T, serializer: (data: T) => any, isDefinedFn: (data: T) => boolean = isDefined) {
  return isDefinedFn(data) ? serializer(data) : null;
}

function serializeList<T>(list: any[], mapper: (obj: any) => T = identity) {
  if (list.length === 0) {
    return null;
  }

  return _.map(list, mapper);
}

function deserializeList<T>(list: any, mapper: (obj: any) => T = identity) {
  return _.map(normalizeAsArray<T>(list), mapper);
}

function serializeEntity<T extends GraphNode>(entity: T, clone: boolean) {
  return entity.serialize(true, clone);
}

function deserializeEntity<T extends GraphNode>(graph: any, context: any, frame: any, entityFactory: EntityFactory<T>): T {
  const constructor = entityFactory(graph);
  return new constructor(graph, context, frame);
}

function serializeEntityOrId(data: GraphNode|Uri, clone: boolean) {
  if (data instanceof GraphNode) {
    return serializeEntity(data, clone);
  } else if (data instanceof Uri) {
    return data.uri;
  } else {
    throw new Error('Item must be instance of GraphNode or Uri');
  }
}

function deserializeEntityOrId<T extends GraphNode>(data: any, context: any, frame: any, entityFactory: EntityFactory<T>): T|Uri {
  if (typeof data === 'object') {
    return deserializeEntity(data, context, frame, entityFactory);
  } else {
    return new Uri(data, context);
  }
}

function serializeEntityList(list: GraphNode[], clone: boolean) {
  return serializeList(list, listItem => serializeEntity(listItem, clone));
}

function deserializeEntityList<T extends GraphNode>(list: any, context: any, frame: any, entityFactory: EntityFactory<T>): T[] {
  return deserializeList<T>(list, graph => deserializeEntity(graph, context, frame, entityFactory));
}

function serializeLocalizable(localizable: Localizable) {
  return Object.assign({}, localizable);
}

function deserializeLocalizable(localizable: any) {
  const result: Localizable = {};

  if (localizable) {
    for (const lang of Object.keys(localizable)) {
      const value = localizable[lang];
      result[lang] = Array.isArray(value) ? value.join(' ') : value;
    }
  }

  return result;
}

function serializeDate(date: Moment) {
  return date.format(isoDateFormat);
}

function deserializeDate(date: any) {
  return moment(date, isoDateFormat);
}

function deserializeUserLogin(userName: string): UserLogin {
  return userName.substring('mailto:'.length);
}

function mapGraphTypeObject(withType: { '@type': string|string[] }): Type[] {
  return _.chain(normalizeAsArray(withType['@type']))
    .map(mapType)
    .reject(type => !type)
    .value();
}

function reverseMapTypeObject(types: Type[]): string[] {
  return _.chain(normalizeAsArray(types))
    .map(reverseMapType)
    .reject(type => !type)
    .value();
}

export function modelUrl(id: string, href: boolean): RelativeUrl {
  return (href ? '#' : '') + `/model?urn=${encodeURIComponent(id)}`;
}

export function groupUrl(id: string, href: boolean): RelativeUrl {
  return (href ? '#' : '') + `/group?urn=${encodeURIComponent(id)}`;
}

export function internalUrl(id: Uri, type: Type[], href: boolean): RelativeUrl {
  if (id) {
    if (containsAny(type, ['model', 'profile'])) {
      return modelUrl(id.uri, href);
    } else if (containsAny(type, ['group'])) {
      return `${groupUrl(id.uri, href)}`;
    } else if (containsAny(type, ['association', 'attribute'])) {
      return `${modelUrl(id.namespaceId, href)}&${normalizeSelectionType(type)}=${encodeURIComponent(id.uri)}`;
    } else if (containsAny(type, ['class', 'shape'])) {
      return `${modelUrl(id.namespaceId, href)}&class=${encodeURIComponent(id.uri)}`;
    } else {
      throw new Error('Unsupported type for url: ' + type);
    }
  } else {
    return null;
  }
}

function frameData($log: angular.ILogService, data: GraphData, frame: any): IPromise<GraphData> {
  return jsonld.promises.frame(data, frame)
    .then((framed: any) => framed, (err: any) => {
      $log.error(frame);
      $log.error(data);
      $log.error(err.message);
      $log.error(err.details.cause);
    });
}


function frameAndMap<T extends GraphNode>($log: angular.ILogService, data: GraphData, optional: boolean, frame: Frame, entityFactory: EntityFactory<T>): IPromise<T> {

  return frameData($log, data, frame)
    .then(framed => {
      try {
        if (optional && framed['@graph'].length === 0) {
          return null;
        } else if (framed['@graph'].length > 1) {
          throw new Error('Multiple graphs found: \n' + JSON.stringify(framed, null, 2));
        } else {
          const entity: EntityConstructor<T> = entityFactory(framed);
          return new entity(framed['@graph'][0], framed['@context'], frame);
        }
      } catch (error) {
        $log.error(error);
        throw error;
      }
    });
}

function frameAndMapArray<T extends GraphNode>($log: angular.ILogService, data: GraphData, frame: Frame, entityFactory: EntityFactory<T>): IPromise<T[]> {

  return frameData($log, data, frame)
    .then(framed => {
      try {
        return _.map(normalizeAsArray(framed['@graph']), element => {
          const entity: EntityConstructor<T> = entityFactory(element);
          return new entity(element, framed['@context'], frame);
        });
      } catch (error) {
        $log.error(error);
        throw error;
      }
    });
}

export class EntityDeserializer {
  /* @ngInject */
  constructor(private $log: angular.ILogService) {
  }

  deserializeGroupList(data: GraphData): IPromise<GroupListItem[]> {
    return frameAndMapArray(this.$log, data, frames.groupListFrame(data), (framedData) => GroupListItem);
  }

  deserializeGroup(data: GraphData): IPromise<Group> {
    return frameAndMap(this.$log, data, true, frames.groupFrame(data), (framedData) => Group);
  }

  deserializeModelList(data: GraphData): IPromise<ModelListItem[]> {
    return frameAndMapArray(this.$log, data, frames.modelListFrame(data), (framedData) => ModelListItem);
  }

  deserializeModel(data: GraphData, id?: Uri|Urn): IPromise<Model> {
    return frameAndMap(this.$log, data, true, frames.modelFrame(data, id), (framedData) => Model);
  }

  deserializeClassList(data: GraphData): IPromise<ClassListItem[]> {
    return frameAndMapArray(this.$log, data, frames.classListFrame(data), (framedData) => ClassListItem);
  }

  deserializeClass(data: GraphData): IPromise<Class> {
    return frameAndMap(this.$log, data, true, frames.classFrame(data), (framedData) => Class);
  }

  deserializeProperty(data: GraphData): IPromise<Property> {
    return frameAndMap(this.$log, data, true, frames.propertyFrame(data), (framedData) => Property);
  }

  deserializePredicateList(data: GraphData): IPromise<PredicateListItem[]> {
    return frameAndMapArray(this.$log, data, frames.predicateListFrame(data), (framedData) => PredicateListItem);
  }

  deserializePredicate(data: GraphData): IPromise<Attribute|Association|Predicate> {

    const entityFactory: EntityFactory<Predicate> = (framedData) => {
      const types = mapGraphTypeObject(framedData['@graph'][0]);

      if (containsAny(types, ['association'])) {
        return Association;
      } else if (containsAny(types, ['attribute'])) {
        return Attribute;
      } else if (containsAny(types, ['property'])) {
        return Predicate;
      } else {
        throw new Error('Incompatible type: ' + types.join());
      }
    };

    return frameAndMap(this.$log, data, true, frames.predicateFrame(data), entityFactory);
  }

  deserializeConceptSuggestion(data: GraphData): IPromise<ConceptSuggestion> {
    return frameAndMap(this.$log, data, true, frames.iowConceptFrame(data), (framedData) => ConceptSuggestion);
  }

  deserializeConceptSuggestions(data: GraphData): IPromise<ConceptSuggestion[]> {
    return frameAndMapArray(this.$log, data, frames.iowConceptFrame(data), (framedData) => ConceptSuggestion);
  }

  deserializeFintoConcept(data: GraphData, id: Url): IPromise<FintoConcept> {
    return frameAndMap(this.$log, data, true, frames.fintoConceptFrame(data, id), (framedData) => FintoConcept);
  }

  deserializeFintoConceptSearchResults(data: GraphData): IPromise<FintoConceptSearchResult[]> {
    return frameAndMapArray(this.$log, data, frames.fintoConceptSearchResultsFrame(data), (framedData) => FintoConceptSearchResult);
  }

  deserializeConcepts(data: GraphData): IPromise<Concept[]> {
    return frameAndMapArray(this.$log, data, frames.iowConceptFrame(data), resolveConceptConstructor);
  }

  deserializeVocabularies(data: GraphData): IPromise<Vocabulary[]> {
    return frameAndMapArray(this.$log, data, frames.vocabularyFrame(data), (framedData) => Vocabulary);
  }

  deserializeImportedNamespace(data: GraphData): IPromise<ImportedNamespace> {
    return frameAndMap(this.$log, data, true, frames.namespaceFrame(data), (framedData) => ImportedNamespace);
  }

  deserializeImportedNamespaces(data: GraphData): IPromise<ImportedNamespace[]> {
    return frameAndMapArray(this.$log, data, frames.namespaceFrame(data), (framedData) => ImportedNamespace);
  }

  deserializeReferenceDataServers(data: GraphData): IPromise<ReferenceDataServer[]> {
    return frameAndMapArray(this.$log, data, frames.referenceDataServerFrame(data), (framedData) => ReferenceDataServer);
  }

  deserializeReferenceData(data: GraphData): IPromise<ReferenceData> {
    return frameAndMap(this.$log, data, true, frames.referenceDataFrame(data), (framedData) => ReferenceData);
  }

  deserializeReferenceDatas(data: GraphData): IPromise<ReferenceData[]> {
    return frameAndMapArray(this.$log, data, frames.referenceDataFrame(data), (framedData) => ReferenceData);
  }

  deserializeReferenceDataCodes(data: GraphData): IPromise<ReferenceDataCode[]> {
    return frameAndMapArray(this.$log, data, frames.referenceDataCodeFrame(data), (framedData) => ReferenceDataCode);
  }

  deserializeUser(data: GraphData): IPromise<User> {
    return frameAndMap(this.$log, data, true, frames.userFrame(data), (framedData) => DefaultUser);
  }

  deserializeSearch(data: GraphData): IPromise<SearchResult[]> {
    return frameAndMapArray(this.$log, data, frames.searchResultFrame(data), (framedData) => SearchResult);
  }

  deserializeModelVisualization(data: GraphData): IPromise<VisualizationClass[]> {
    return frameAndMapArray(this.$log, data, frames.classVisualizationFrame(data), (framedData) => DefaultVisualizationClass);
  }

  deserializeUsage(data: GraphData): IPromise<Usage> {
    return frameAndMap(this.$log, data, true, frames.usageFrame(data), (framedData) => DefaultUsage);
  }

  deserializeVersion(data: GraphData): IPromise<Activity> {
    return frameAndMap(this.$log, data, true, frames.versionFrame(data), (framedData) => Activity);
  }
}
