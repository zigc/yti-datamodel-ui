import { ImportedNamespace, Model } from 'app/entities/model';
import { Localizable } from 'yti-common-ui/types/localization';
import { dateSerializer, typeSerializer } from 'app/entities/serializer/serializer';
import { uriSerializer } from 'app/entities/serializer/entitySerializer';
import { KnownModelType, KnownPredicateType } from 'app/types/entity';
import { Uri } from 'app/entities/uri';
import { classIdFromNamespaceId, modelIdFromPrefix, predicateIdFromNamespaceId } from 'app/help/utils';
import { upperCaseFirst } from 'change-case';
import { Language } from 'app/types/language';
import { Concept, Vocabulary } from 'app/entities/vocabulary';
import * as moment from 'moment';
import { Association, Attribute, Predicate } from 'app/entities/predicate';
import { IPromise, IQService } from 'angular';
import { Class, Property } from 'app/entities/class';
import { Organization } from 'app/entities/organization';
import { Classification } from 'app/entities/classification';

const technicalNamespaces = {
  'schema': 'http://schema.org/',
  'dcap': 'http://purl.org/ws-mmi-dc/terms/',
  'void': 'http://rdfs.org/ns/void#',
  'adms': 'http://www.w3.org/ns/adms#',
  'skosxl': 'http://www.w3.org/2008/05/skos-xl#',
  'dcam': 'http://purl.org/dc/dcam/',
  'owl': 'http://www.w3.org/2002/07/owl#',
  'afn': 'http://jena.hpl.hp.com/ARQ/function#',
  'xsd': 'http://www.w3.org/2001/XMLSchema#',
  'skos': 'http://www.w3.org/2004/02/skos/core#',
  'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
  'iow': 'http://uri.suomi.fi/datamodel/ns/iow#',
  'sd': 'http://www.w3.org/ns/sparql-service-description#',
  'at': 'http://publications.europa.eu/ontology/authority/',
  'sh': 'http://www.w3.org/ns/shacl#',
  'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  'dcterms': 'http://purl.org/dc/terms/',
  'text': 'http://jena.apache.org/text#',
  'termed': 'http://termed.thl.fi/meta/',
  'prov': 'http://www.w3.org/ns/prov#',
  'foaf': 'http://xmlns.com/foaf/0.1/',
  'ts': 'http://www.w3.org/2003/06/sw-vocab-status/ns#',
  'dc': 'http://purl.org/dc/elements/1.1/'
};

const terminologyContext = {
  prefLabel : { '@id' : 'http://www.w3.org/2004/02/skos/core#prefLabel' },
  definition : { '@id' : 'http://www.w3.org/2004/02/skos/core#definition' },
  description : { '@id' : 'http://purl.org/dc/terms/description' },
  inScheme : { '@id' : 'http://www.w3.org/2004/02/skos/core#inScheme', '@type' : '@id' },
  id : { '@id' : 'http://termed.thl.fi/meta/id' },
  graph : { '@id' : 'http://termed.thl.fi/meta/graph' },
  type : { '@id' : 'http://termed.thl.fi/meta/type' },
  uri : { '@id' : 'http://termed.thl.fi/meta/uri' },
};

export interface ImportedExternalNamespaceDetails {
  label: Localizable;
  prefix: string;
  namespace: string;
}

export interface OrganizationDetails {
  id: Uri;
  label: Localizable;
}

interface PredicateDetails {
  type: KnownPredicateType;
  model: Model;
  lang: Language;
  label: string;
  concept?: Concept;
}

interface ClassDetails {
  model: Model;
  lang: Language;
  label: string;
  concept?: Concept;
}

export interface PropertyDetails {
  predicate: Predicate;
  type: KnownPredicateType;
}

export interface VocabularyDetails {
  prefix: string;
  index: number;
  label: Localizable;
  description: Localizable;
}

export interface ConceptDetails {
  vocabulary: Vocabulary;
  index: number;
  label: Localizable;
  definition: Localizable;
}

export interface ModelDetails {
  type: KnownModelType;
  label: Localizable;
  prefix: string;
  organizations: Organization[];
  classifications: Classification[];
  languages: Language[];
}

// XXX: currently only for help/entity loader usage, but it should be investigated if creator apis could be replaced completely
export class EntityCreatorService {

  constructor(private $q: IQService) {
    'ngInject';
  }

  createModel(details: ModelDetails): IPromise<Model> {

    const namespace = `http://uri.suomi.fi/datamodel/ns/${details.prefix}#`;

    const context = {
      'rest' : {
        '@id' : 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
        '@type' : '@id'
      },
      'first' : {
        '@id' : 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first'
      },
      'identifier' : {
        '@id' : 'http://purl.org/dc/terms/identifier'
      },
      'label' : {
        '@id' : 'http://www.w3.org/2000/01/rdf-schema#label'
      },
      'prefLabel' : {
        '@id' : 'http://www.w3.org/2004/02/skos/core#prefLabel'
      },
      'preferredXMLNamespacePrefix' : {
        '@id' : 'http://purl.org/ws-mmi-dc/terms/preferredXMLNamespacePrefix'
      },
      'modified' : {
        '@id' : 'http://purl.org/dc/terms/modified',
        '@type' : 'http://www.w3.org/2001/XMLSchema#dateTime'
      },
      'created' : {
        '@id' : 'http://purl.org/dc/terms/created',
        '@type' : 'http://www.w3.org/2001/XMLSchema#dateTime'
      },
      'contributor' : {
        '@id' : 'http://purl.org/dc/terms/contributor',
        '@type' : '@id'
      },
      'isPartOf' : {
        '@id' : 'http://purl.org/dc/terms/isPartOf',
        '@type' : '@id'
      },
      'preferredXMLNamespaceName' : {
        '@id' : 'http://purl.org/ws-mmi-dc/terms/preferredXMLNamespaceName'
      },
      'language' : {
        '@id' : 'http://purl.org/dc/terms/language',
        '@type' : '@id'
      },
      'versionInfo' : {
        '@id' : 'http://www.w3.org/2002/07/owl#versionInfo'
      },
      ...technicalNamespaces,
      [details.prefix]: namespace
    };

    const currentTime = dateSerializer.serialize(moment());

    const graph = {
      '@id': modelIdFromPrefix(details.prefix),
      '@type': details.type === 'profile' ? ['owl:Ontology', 'dcap:DCAP'] : ['owl:Ontology', 'dcap:MetadataVocabulary'],
      'contributor': details.organizations.map(o => o.serialize(true, false)),
      'created': currentTime,
      'isPartOf': details.classifications.map(c => c.serialize(true, false)),
      'dcterms:language': details.languages,
      'modified': currentTime,
      'preferredXMLNamespaceName': namespace,
      'preferredXMLNamespacePrefix': details.prefix,
      'label': {...details.label},
      'versionInfo': 'DRAFT'
    };

    return this.$q.when(new Model(graph, context, null));
  }

  createImportedNamespaces(detailsList: (ImportedExternalNamespaceDetails|Model)[]): IPromise<ImportedNamespace[]> {
    return this.$q.all(detailsList.map(details => this.createImportedNamespace(details)));
  }

  createImportedNamespace(details: ImportedExternalNamespaceDetails|Model): IPromise<ImportedNamespace> {

    const context: any = {
      'preferredXMLNamespacePrefix': {
        '@id': 'http://purl.org/ws-mmi-dc/terms/preferredXMLNamespacePrefix'
      },
      'preferredXMLNamespaceName': {
        '@id': 'http://purl.org/ws-mmi-dc/terms/preferredXMLNamespaceName'
      },
      'label': {
        '@id': 'http://www.w3.org/2000/01/rdf-schema#label'
      },
      ...technicalNamespaces
    };

    if (details instanceof Model) {
      details.expandContextWithKnownModels(context);
    } else {
      context[details.prefix] = details.namespace;
    }

    const graph = {
      '@id': details instanceof Model ? uriSerializer.serialize(details.id, false) : details.namespace,
      '@type': details instanceof Model ? typeSerializer.serialize(details.type) : 'dcterms:Standard',
      'label': { ...details.label },
      'preferredXMLNamespaceName': details.namespace,
      'preferredXMLNamespacePrefix': details.prefix
    };

    return this.$q.when(new ImportedNamespace(graph, context, null));
  }

  createOrganizations(detailsList: OrganizationDetails[]): IPromise<Organization[]> {
    return this.$q.all(detailsList.map(details => this.createOrganization(details)));
  }

  createOrganization(details: OrganizationDetails): IPromise<Organization> {

    const context = {
      'homepage' : {
        '@id' : 'http://xmlns.com/foaf/0.1/homepage'
      },
      'prefLabel' : {
        '@id' : 'http://www.w3.org/2004/02/skos/core#prefLabel'
      },
      'description' : {
        '@id' : 'http://purl.org/dc/terms/description'
      }
    };

    const graph = {
      '@id': details.id.uuid,
      '@type': 'foaf:Organization',
      'prefLabel': { ...details.label }
    };

    return this.$q.when(new Organization(graph, context, null));
  }

  createPredicate(details: PredicateDetails): IPromise<Predicate> {

    const context = {
      'versionInfo': {
        '@id': 'http://www.w3.org/2002/07/owl#versionInfo'
      },
      'modified': {
        '@id': 'http://purl.org/dc/terms/modified',
        '@type': 'http://www.w3.org/2001/XMLSchema#dateTime'
      },
      'created': {
        '@id': 'http://purl.org/dc/terms/created',
        '@type': 'http://www.w3.org/2001/XMLSchema#dateTime'
      },
      'label': {
        '@id': 'http://www.w3.org/2000/01/rdf-schema#label'
      },
      'isDefinedBy': {
        '@id': 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy',
        '@type': '@id'
      },
      ...technicalNamespaces,
    };

    details.model.expandContextWithKnownModels(context);

    const currentTime = dateSerializer.serialize(moment());

    const graph: any = {
      '@id': predicateIdFromNamespaceId(details.model.id.uri, details.label),
      '@type': typeSerializer.serialize([details.type]),
      created: currentTime,
      modified: currentTime,
      subject: details.concept ? details.concept.serialize(true, false) : null,
      label: { [details.lang]: upperCaseFirst(details.label) },
      comment: details.concept ? { ...details.concept.definition } : {},
      isDefinedBy: details.model.asDefinedBy().serialize(true, false),
      versionInfo: 'DRAFT'
    };

    if (details.type === 'attribute') {
      graph.range = 'xsd:string';
    }

    return this.$q.when(details.type === 'attribute' ? new Attribute(graph, context, null)
                                                     : new Association(graph, context, null));
  }

  createClass(details: ClassDetails): IPromise<Class> {

    const context = {
      'subject': {
        '@id': 'http://purl.org/dc/terms/subject',
        '@type': '@id'
      },
      'description': {
        '@id': 'http://www.w3.org/ns/shacl#description'
      },
      'name': {
        '@id': 'http://www.w3.org/ns/shacl#name'
      },
      'isDefinedBy': {
        '@id': 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy',
        '@type': '@id'
      },
      'created': {
        '@id': 'http://purl.org/dc/terms/created',
        '@type': 'http://www.w3.org/2001/XMLSchema#dateTime'
      },
      'modified': {
        '@id': 'http://purl.org/dc/terms/modified',
        '@type': 'http://www.w3.org/2001/XMLSchema#dateTime'
      },
      'versionInfo': {
        '@id': 'http://www.w3.org/2002/07/owl#versionInfo'
      },
      'prefLabel': {
        '@id': 'http://www.w3.org/2004/02/skos/core#prefLabel'
      },
      'label': {
        '@id': 'http://www.w3.org/2000/01/rdf-schema#label'
      },
      'definition': {
        '@id': 'http://www.w3.org/2004/02/skos/core#definition'
      },
      'inScheme': {
        '@id': 'http://www.w3.org/2004/02/skos/core#inScheme',
        '@type': '@id'
      },
      'graph': {
        '@id': 'http://termed.thl.fi/meta/graph'
      },
      'id': {
        '@id': 'http://termed.thl.fi/meta/id'
      },
      ...technicalNamespaces
    };

    details.model.expandContextWithKnownModels(context);

    const currentTime = dateSerializer.serialize(moment());

    const graph = {
      '@id': classIdFromNamespaceId(details.model.id.uri, details.label),
      '@type': 'rdfs:Class',
      created: currentTime,
      modified: currentTime,
      subject: details.concept ? details.concept.serialize(true, false) : null,
      name: { [details.lang]: upperCaseFirst(details.label) },
      description: details.concept ? { ...details.concept.definition } : {},
      isDefinedBy: details.model.asDefinedBy().serialize(true, false),
      versionInfo: 'DRAFT'
    };

    return this.$q.when(new Class(graph, context, null));
  }

  createShape(klass: Class, profile: Model): IPromise<Class> {

    const shape = klass.clone();
    const currentTime = moment();
    shape.context[profile.prefix] = profile.namespace;

    shape.id = new Uri(profile.namespace + shape.id.name, shape.context);
    shape.definedBy = profile.asDefinedBy();
    shape.unsaved = true;
    shape.createdAt = currentTime;
    shape.modifiedAt = currentTime;
    shape.scopeClass = klass.id;

    for (const property of shape.properties) {
      property.status = 'DRAFT';
    }

    shape.status = 'DRAFT';

    return this.$q.when(shape);
  }

  createProperty(details: PropertyDetails): IPromise<Property> {

    const currentTime = dateSerializer.serialize(moment());

    const context = {
      'name': {
        '@id': 'http://www.w3.org/ns/shacl#name'
      },
      'localName': {
        '@id': 'http://uri.suomi.fi/datamodel/ns/iow#localName'
      },
      'datatype': {
        '@id': 'http://www.w3.org/ns/shacl#datatype',
        '@type': '@id'
      },
      'description': {
        '@id': 'http://www.w3.org/ns/shacl#description'
      },
      'path': {
        '@id': 'http://www.w3.org/ns/shacl#path',
        '@type': '@id'
      },
      'equivalentProperty': {
        '@id': 'http://www.w3.org/2002/07/owl#equivalentProperty',
        '@type': '@id'
      },
      'type': {
        '@id': 'http://purl.org/dc/terms/type',
        '@type': '@id'
      },
      'created': {
        '@id': 'http://purl.org/dc/terms/created',
        '@type': 'http://www.w3.org/2001/XMLSchema#dateTime'
      },
      ...technicalNamespaces,
      ...details.predicate.context
    };

    const graph: any = {
      '@id': Uri.randomUUID().toString(),
      '@type': 'sh:PropertyShape',
      created: currentTime,
      type: typeSerializer.serialize([details.type])[0],
      name: { ...details.predicate.label },
      description:  { ...details.predicate.comment },
      path: details.predicate.id.curie
    };

    function predicateIsAssociation(predicate: Predicate): predicate is Association {
      return predicate.isOfType('association');
    }

    function predicateIsAttribute(predicate: Predicate): predicate is Attribute {
      return predicate.isOfType('attribute');
    }

    if (details.type === 'attribute') {
      if (!predicateIsAttribute(details.predicate)) {
        throw new Error('Predicate must be attribute');
      }
      graph.datatype = details.predicate.dataType || 'xsd:string';
    } else {
      if (!predicateIsAssociation(details.predicate)) {
        throw new Error('Predicate must be association');
      }
      graph.node = details.predicate.valueClass && details.predicate.valueClass.curie;
    }

    return this.$q.when(new Property(graph, context, null));
  }

  createVocabulary(details: VocabularyDetails): IPromise<Vocabulary> {

    const id = `http://uri.suomi.fi/terminology/${details.prefix}/terminological-vocabulary-${details.index}`;

    const graph = {
      '@id': id,
      '@type': 'skos:ConceptScheme',
      graph: Uri.randomUUID().toString(),
      id: Uri.randomUUID().toString(),
      type: 'TerminologicalVocabulary',
      uri: id,
      prefLabel: { ...details.label },
      description: { ...details.description }
    };

    return this.$q.when(new Vocabulary(graph, terminologyContext, null));
  }

  createConcept(details: ConceptDetails): IPromise<Concept> {

    const vocabularyId = details.vocabulary.id.uri;
    const vocabularyNamespace = vocabularyId.substr(0, vocabularyId.indexOf('terminological-vocabulary-'));
    const id = vocabularyNamespace + 'concept-' + details.index;

    const graph = {
      '@id': id,
      '@type': 'skos:Concept',
      inScheme: details.vocabulary.serialize(true, false),
      id: Uri.randomUUID().toString(),
      graph: details.vocabulary.vocabularyGraph,
      definition: { ...details.definition },
      prefLabel: { ...details.label }
    };

    return this.$q.when(new Concept(graph, terminologyContext, null));
  }
}
