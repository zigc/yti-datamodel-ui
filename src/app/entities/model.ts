import * as _ from 'lodash';
import { requireDefined } from 'yti-common-ui/utils/object';
import { KnownModelType, Type, UseContext } from 'app/types/entity';
import { modelUrl, normalizeModelType, resourceUrl } from 'app/utils/entity';
import { Uri, Url, Urn } from './uri';
import { Language } from 'app/types/language';
import { Moment } from 'moment';
import { containsAny, remove } from 'yti-common-ui/utils/array';
import { DefinedBy } from './definedBy';
import { Vocabulary } from './vocabulary';
import { ReferenceData } from './referenceData';
import { init, serialize } from './mapping';
import { GraphNode } from './graphNode';
import { entity, entityAwareList, entityAwareOptional, uriSerializer } from './serializer/entitySerializer';
import {
  dateSerializer, identitySerializer, languageSerializer, list, localizableSerializer, optional,
  stringSerializer, typeSerializer, valueOrDefault
} from './serializer/serializer';
import { Localizable } from 'yti-common-ui/types/localization';
import { Organization } from './organization';
import { Classification } from './classification';
import { Status } from 'yti-common-ui/entities/status';

function normalizeType(type: Type[]): KnownModelType {
  const normalizedType = requireDefined(normalizeModelType(type));

  if (normalizedType === 'model') {
    throw new Error('Model type must be known');
  } else {
    return normalizedType;
  }
}

export abstract class AbstractModel extends GraphNode {

  static abstractModelMappings = {
    id:        { name: '@id',                         serializer: uriSerializer },
    label:     { name: 'label',                       serializer: localizableSerializer },
    namespace: { name: 'preferredXMLNamespaceName',   serializer: stringSerializer },
    prefix:    { name: 'preferredXMLNamespacePrefix', serializer: stringSerializer }
  };

  id: Uri;
  label: Localizable;
  namespace: Url;
  prefix: string;
  normalizedType = normalizeType(this.type);

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, AbstractModel.abstractModelMappings);
  }

  iowUrl() {
    return modelUrl(this.prefix);
  }
}

export class ModelListItem extends AbstractModel {

  static modelListItemMappings = {
    comment:         { name: 'comment',     serializer: localizableSerializer },
    status:          { name: 'versionInfo', serializer: identitySerializer<Status>() },
    classifications: { name: 'isPartOf',    serializer: entityAwareList(entity(() => Classification)) },
    contributors:    { name: 'contributor', serializer: entityAwareList(entity(() => Organization)) }
  };

  comment: Localizable;
  status: Status;
  classifications: Classification[];
  contributors: Organization[];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, ModelListItem.modelListItemMappings);
  }
}

export class Model extends AbstractModel {

  static modelMappings = {
    comment:            { name: 'comment',      serializer: localizableSerializer },
    status:             { name: 'versionInfo',  serializer: identitySerializer<Status>() },
    vocabularies:       { name: 'references',   serializer: entityAwareList(entity(() => Vocabulary)) },
    importedNamespaces: { name: 'requires',     serializer: entityAwareList(entity(() => ImportedNamespace)) },
    links:              { name: 'relations',    serializer: entityAwareList(entity(() => Link)) },
    referenceDatas:     { name: 'codeLists',    serializer: entityAwareList(entity(() => ReferenceData)) },
    classifications:    { name: 'isPartOf',     serializer: entityAwareList(entity(() => Classification)) },
    contributors:       { name: 'contributor',  serializer: entityAwareList(entity(() => Organization)) },
    version:            { name: 'identifier',   serializer: optional(identitySerializer<Urn>()) },
    rootClass:          { name: 'rootResource', serializer: entityAwareOptional(uriSerializer) },
    language:           { name: 'language',     serializer: list<Language>(languageSerializer, ['fi', 'en']) },
    modifiedAt:         { name: 'modified',     serializer: optional(dateSerializer) },
    createdAt:          { name: 'created',      serializer: optional(dateSerializer) },
    useContext:         { name: 'useContext',   serializer: valueOrDefault(identitySerializer<UseContext>(), 'InformationDescription') }
  };

  comment: Localizable;
  status: Status;
  vocabularies: Vocabulary[];
  importedNamespaces: ImportedNamespace[];
  links: Link[];
  referenceDatas: ReferenceData[];
  classifications: Classification[];
  contributors: Organization[];
  unsaved = false;
  version: Urn|null;
  rootClass: Uri|null;
  language: Language[];
  modifiedAt: Moment|null;
  createdAt: Moment|null;
  useContext: UseContext;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);

    init(this, Model.modelMappings);
    this.copyNamespacesFromRequires();
  }

  addVocabulary(vocabulary: Vocabulary) {
    this.vocabularies.push(vocabulary);
  }

  removeVocabulary(vocabulary: Vocabulary) {
    remove(this.vocabularies, vocabulary);
  }

  addImportedNamespace(ns: ImportedNamespace) {
    this.importedNamespaces.push(ns);
    this.context[ns.prefix] = ns.namespace;
  }

  removeImportedNamespace(ns: ImportedNamespace) {
    if (ns.namespaceType !== NamespaceType.TECHNICAL) {
      delete this.context[ns.prefix];
    }
    remove(this.importedNamespaces, ns);
  }

  addLink(link: Link) {
    this.links.push(link);
  }

  removeLink(link: Link) {
    remove(this.links, link);
  }

  addReferenceData(referenceData: ReferenceData) {
    this.referenceDatas.push(referenceData);
  }

  removeReferenceData(referenceData: ReferenceData) {
    remove(this.referenceDatas, referenceData);
  }

  getNamespaces(): Namespace[] {

    const namespaces: Namespace[] = [];
    const requiredNamespacePrefixes = new Set<string>();

    namespaces.push({
      prefix: this.prefix,
      url: this.namespace,
      namespaceType: NamespaceType.MODEL
    });

    requiredNamespacePrefixes.add(this.prefix);

    for (const require of this.importedNamespaces) {

      namespaces.push({
        prefix: require.prefix,
        url: require.namespace,
        namespaceType: require.namespaceType
      });

      requiredNamespacePrefixes.add(require.prefix);
    }

    for (const prefix of Object.keys(this.context)) {
      if (!requiredNamespacePrefixes.has(prefix)) {
        const value = this.context[prefix];
        if (typeof value === 'string') {
          namespaces.push({
            prefix: prefix,
            url: value,
            namespaceType: NamespaceType.IMPLICIT_TECHNICAL
          });
        }
      }
    }

    return namespaces;
  }

  private copyNamespacesFromRequires() {
    for (const require of this.importedNamespaces) {
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

    const models: {[prefix: string]: string} = {};

    for (const namespace of this.getNamespaces()) {
      if (namespace.namespaceType === NamespaceType.MODEL || namespace.namespaceType === NamespaceType.EXTERNAL) {
        models[namespace.prefix] = namespace.url;
      }
    }

    Object.assign(context, models);
  }

  asDefinedBy() {
    return new DefinedBy({'@id': this.id.uri, '@type': typeSerializer.serialize(this.type), label: this.label}, this.context, this.frame);
  }

  namespaceAsDefinedBy(ns: Url) {
    for (const require of this.importedNamespaces) {
      if (ns === require.namespace) {
        return new DefinedBy({'@id': ns, '@type': typeSerializer.serialize(require.type)}, this.context, this.frame);
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

  isNamespaceKnownAndOfType(namespace: Url, types: NamespaceType[]): boolean  {
    for (const knownNamespace of this.getNamespaces()) {
      if (namespace === knownNamespace.url && containsAny(types, [knownNamespace.namespaceType])) {
        return true;
      }
    }
    return false;
  }

  linkToResource(id: Uri|null) {
    if (id && !id.isUrn()) {
      if (this.isNamespaceKnownToBeModel(id.namespace)) {
        return resourceUrl(requireDefined(id.resolve()).prefix, id);
      } else {
        return id.url;
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

  serializationValues(_inline: boolean, clone: boolean): {} {
    this.copyNamespacesFromRequires();
    return serialize(this, clone, Object.assign({}, AbstractModel.abstractModelMappings, Model.modelMappings));
  }

  addClassification(classification: Classification) {
    this.classifications.push(classification);
  }

  removeClassification(classification: Classification) {
    remove(this.classifications, classification);
  }

  addContributor(organization: Organization) {
    this.contributors.push(organization);
  }

  removeContributor(organization: Organization) {
    remove(this.contributors, organization);
  }
}

export class ImportedNamespace extends GraphNode implements Namespace {

  static importedNamespaceMappings = {
    id:         { name: '@id',                         serializer: uriSerializer },
    label:      { name: 'label',                       serializer: localizableSerializer },
    _prefix:    { name: 'preferredXMLNamespacePrefix', serializer: stringSerializer },
    _namespace: { name: 'preferredXMLNamespaceName',   serializer: identitySerializer<Url>() }
  };

  id: Uri;
  label: Localizable;
  private _prefix: string;
  private _namespace: Url;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, ImportedNamespace.importedNamespaceMappings);
  }

  get namespaceType(): NamespaceType {
    if (this.isOfType('resource')) {
      return NamespaceType.EXTERNAL;
    } else if (this.isOfType('standard')) {
      return NamespaceType.TECHNICAL;
    } else if (this.isOfType('model', 'library', 'profile')) {
      return NamespaceType.MODEL;
    } else {
      throw new Error('Unsupported type for imported namespace: [' + this.type.join(',') + '] for ' + this.id.toString());
    }
  }

  convertAsTechnical() {
    this.type = ['standard'];
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
    this.id = new Uri(_.trimEnd(ns, '#/'), { [this.prefix]: ns });
  }

  get url() {
    return this.namespace;
  }

  serializationValues(inline: boolean, clone: boolean): {} {

    const onlyIdAndType = inline && !clone && this.namespaceType === NamespaceType.MODEL;

    const exclude = !onlyIdAndType ? [] : [
      ImportedNamespace.importedNamespaceMappings._namespace,
      ImportedNamespace.importedNamespaceMappings._prefix,
      ImportedNamespace.importedNamespaceMappings.label
    ];

    return serialize(this, clone, ImportedNamespace.importedNamespaceMappings, exclude);
  }
}

export class Link extends GraphNode {

  static linkMappings = {
    homepage:    { name: 'homepage',    serializer: uriSerializer },
    title:       { name: 'title',       serializer: localizableSerializer },
    description: { name: 'description', serializer: localizableSerializer }
  };

  homepage: Uri;
  title: Localizable;
  description: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, Link.linkMappings);
  }

  serializationValues(_inline: boolean, clone: boolean): any {
    return serialize(this, clone, Link.linkMappings);
  }
}

export enum NamespaceType {
  IMPLICIT_TECHNICAL, TECHNICAL, MODEL, EXTERNAL
}

export interface Namespace {
  prefix: string;
  url: string;
  namespaceType: NamespaceType;
}
