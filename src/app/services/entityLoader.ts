import { IPromise, IQService } from 'angular';
import { ModelService } from './modelService';
import { ClassService } from './classService';
import { PredicateService } from './predicateService';
import { ResetService } from './resetService';
import { Uri, Url } from 'app/entities/uri';
import { DataType } from 'app/entities/dataTypes';
import { identity, requireDefined } from 'yti-common-ui/utils/object';
import { ConstraintType, KnownModelType, KnownPredicateType } from 'app/types/entity';
import { Model } from 'app/entities/model';
import { Concept, Vocabulary } from 'app/entities/vocabulary';
import { Class, Property } from 'app/entities/class';
import { Association, Attribute, Predicate } from 'app/entities/predicate';
import { VocabularyService } from './vocabularyService';
import { firstMatching, keepMatching } from 'yti-common-ui/utils/array';
import { Localizable } from 'yti-common-ui/types/localization';
import { Status } from 'yti-common-ui/entities/status';
import { EntityCreatorService } from '../help/services/entityCreatorService';
import { Organization } from 'app/entities/organization';
import { Classification } from 'app/entities/classification';
import { InteractiveHelpVocabularyService } from '../help/services/helpVocabularyService';

export type Resolvable<T> = string|IPromise<T>|(() => IPromise<T>);

export interface EntityDetails {
  label?: Localizable;
  comment?: Localizable;
  status?: Status;
}

export interface ExternalNamespaceDetails {
  prefix: string;
  namespace: Url;
  label: string;
}

export interface ModelDetails extends EntityDetails {
  type: KnownModelType;
  label: Localizable;
  prefix: string;
  vocabularies?: Resolvable<Vocabulary>[];
  namespaces?: (Resolvable<Model>|ExternalNamespaceDetails)[];
  organizations: Resolvable<Organization>[];
  classifications: Resolvable<Classification>[];
}

export interface ConstraintDetails {
  type: ConstraintType;
  comment: Localizable;
  shapes: Resolvable<Class>[];
}

export interface ClassDetails extends EntityDetails {
  label: Localizable;
  id?: string;
  subClassOf?: Resolvable<Class>;
  concept?: Url|ConceptDetails;
  equivalentClasses?: Resolvable<Class>[];
  properties?: PropertyDetails[];
  constraint?: ConstraintDetails;
}

export interface ShapeDetails extends EntityDetails {
  class: Resolvable<Class>;
  id?: string;
  equivalentClasses?: Resolvable<Class>[];
  propertyFilter?: (accept: Property) => boolean;
  properties?: PropertyDetails[];
  constraint?: ConstraintDetails;
}

export interface PredicateDetails extends EntityDetails {
  label: Localizable;
  id?: string;
  subPropertyOf?: Resolvable<Predicate>;
  concept?: string|ConceptDetails;
  equivalentProperties?: Resolvable<Predicate>[];
}

export interface AttributeDetails extends PredicateDetails {
  dataType?: DataType;
}

export interface AssociationDetails extends PredicateDetails {
  valueClass?: Resolvable<Class>;
}

export interface PropertyDetails extends EntityDetails {
  predicate: Resolvable<Predicate>;
  example?: string;
  dataType?: DataType;
  valueClass?: Resolvable<Class>;
  minCount?: number;
  maxCount?: number;
  pattern?: string;
  internalId?: string;
}

export interface ConceptDetails {
  label: Localizable,
  definition: Localizable
}

export interface ConceptSuggestionDetails {
  label: string;
  comment: string;
}

export type VocabularyDefinition = ConceptDetails[];

export interface ModelWithResourcesDefinition {
  model: ModelDetails;
  classes: { [name: string]: ClassDetails };
  attributes: { [name: string]: AttributeDetails };
  associations: { [name: string]: AssociationDetails };
}

export class EntityLoaderService {

  constructor(private $q: IQService,
              private modelService: ModelService,
              private predicateService: PredicateService,
              private classService: ClassService,
              private vocabularyService: VocabularyService,
              private helpVocabularyService: InteractiveHelpVocabularyService|null,
              private entityCreatorService: EntityCreatorService,
              private resetService: ResetService) {
    'ngInject';
  }

  create(shouldReset: boolean): EntityLoader {
    return new EntityLoader(
      this.$q,
      this.modelService,
      this.predicateService,
      this.classService,
      this.vocabularyService,
      this.helpVocabularyService,
      this.entityCreatorService,
      this.resetService,
      shouldReset
    );
  }
}

// copy-paste with entityCreatorService
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

export class EntityLoader {

  private initialized: IPromise<any>;
  private actions: IPromise<any>[] = [];

  private context: any = { ...technicalNamespaces };

  constructor(private $q: IQService,
              private modelService: ModelService,
              private predicateService: PredicateService,
              private classService: ClassService,
              private vocabularyService: VocabularyService,
              private helpVocabularyService: InteractiveHelpVocabularyService|null,
              private entityCreatorService: EntityCreatorService,
              resetService: ResetService,
              shouldReset: boolean) {
    'ngInject';

    const reset = shouldReset ? resetService.reset() : $q.when();

    const initialized = $q.defer();
    this.initialized = initialized.promise;

    reset.then(() => initialized.resolve());
  }

  private addAction<T>(action: IPromise<T>, details: any): IPromise<T> {
    const withDetails = action.then(identity, failWithDetails(this.$q, details));
    this.actions.push(withDetails);
    return withDetails;
  }

  get result(): IPromise<any> {
    return this.$q.all(this.actions);
  }

  createModelWithResources(modelWithResources: ModelWithResourcesDefinition) {

    const modelPromise = this.createModel(modelWithResources.model);
    const promises: IPromise<any>[] = [modelPromise];

    for (const attributeDetails of Object.values(modelWithResources.attributes)) {
      promises.push(this.createAttribute(modelPromise, attributeDetails));
    }

    for (const associationDetails of Object.values(modelWithResources.associations)) {
      promises.push(this.createAssociation(modelPromise, associationDetails));
    }

    this.$q.all(promises).then(() => {
      for (const classDetails of Object.values(modelWithResources.classes)) {
        promises.push(this.createClass(modelPromise, classDetails));
      }
    });
  }

  createConcept(details: ConceptDetails): IPromise<Concept> {

    if (!this.helpVocabularyService) {
      throw new Error('Concept creation is only available to help');
    }

    return this.addAction(this.helpVocabularyService.createConcept(details.label, details.definition), details);
  }

  createVocabulary(details: VocabularyDefinition) {
    for (const conceptDetails of details) {
      this.createConcept(conceptDetails);
    }
  }

  createConceptSuggestion(details: ConceptSuggestionDetails, modelPromise: IPromise<Model>): IPromise<Uri> {
    const result = modelPromise.then((model: Model) =>
      this.vocabularyService.createConceptSuggestion(model.vocabularies[0], details.label, details.comment, 'fi', model));

    return this.addAction(result, details);
  }

  createModel(details: ModelDetails): IPromise<Model> {

    const classificationsPromise = this.$q.all((details.classifications || []).map(asIdentifierPromise));
    const organizationsPromise = this.$q.all((details.organizations || []).map(resolvable => asUuidPromise(resolvable)));

    const allVocabulariesPromise = this.vocabularyService.getAllVocabularies();

    const fetchVocabulary = (id: string) => allVocabulariesPromise.then(
      allVocabularies => requireDefined(firstMatching(allVocabularies, (voc: Vocabulary) => voc.id.toString() === id), 'vocabulary not found')
    );

    const result =
      this.initialized.then(() => this.$q.all([classificationsPromise, organizationsPromise]))
        .then(([classifications, organizations]) =>
          this.modelService.newModel(
            details.prefix,
            details.label['fi'],
            classifications,
            organizations,
            ['fi', 'en'],
            details.type)
        ).then(model => {

        setDetails(model, details);

        this.context[model.prefix] = model.namespace;

        const promises: IPromise<any>[] = [];

        for (const vocabulary of details.vocabularies || []) {
          promises.push(asPromise(vocabulary, fetchVocabulary)
            .then(importedVocabulary => model.addVocabulary(importedVocabulary))
          );
        }

        for (const namespace of details.namespaces || []) {

          if (isResolvable(namespace)) {

            const fetchImportedNamespace = (id: string) => this.modelService.getModelByUrn(id);

            promises.push(
              asPromise(namespace, fetchImportedNamespace)
                .then(importedModel => this.entityCreatorService.createImportedNamespace(importedModel))
                .then(ns => model.addImportedNamespace(ns))
            );

          } else if (isExternalNamespace(namespace)) {
            promises.push(this.modelService.newNamespaceImport(namespace.namespace, namespace.prefix, namespace.label, 'fi')
              .then(newImportedNamespace => model.addImportedNamespace(newImportedNamespace))
            );
          } else {
            throw new Error('Unknown namespace: ' + namespace);
          }
        }

        return this.$q.all(promises)
          .then(() => this.modelService.createModel(model))
          .then(() => model);
      });

    return this.addAction(result, details);
  }

  assignClass(modelPromise: IPromise<Model>, klass: Resolvable<Class>): IPromise<any> {

    const classIdPromise = asIdPromise(klass, this.context);

    const result =
      this.$q.all([modelPromise, classIdPromise])
        .then(([model, classId]: [Model, Uri]) => this.classService.assignClassToModel(classId, model));

    return this.addAction(result, 'assign class');
  }

  specializeClass(modelPromise: IPromise<Model>, details: ShapeDetails): IPromise<Class> {

    const result =
      modelPromise.then(model => {
        const fetchClass = (id: string) => this.classService.getClass(new Uri(id, this.context), model);
        return asPromise(details.class, fetchClass).then(klass => [model, klass])
      })
        .then(([model, klass]: [Model, Class]) => {
          const fetchClass = (id: string) => this.classService.getClass(new Uri(id, this.context), model);
          return this.classService.newShape(klass, model, false, 'fi')
            .then(shape => {
              setDetails(shape, details);
              setId(shape, details);

              const promises: IPromise<any>[] = [];

              for (const property of details.properties || []) {
                promises.push(this.createProperty(modelPromise, property).then(prop => {
                  shape.addProperty(prop);
                }));
              }

              if (details.propertyFilter && details.properties) {
                throw new Error('Shape cannot declare both properties and property filter');
              }

              if (details.propertyFilter) {
                keepMatching(shape.properties, details.propertyFilter);
              }

              for (const equivalentClass of details.equivalentClasses || []) {
                promises.push(asIdPromise(equivalentClass, this.context)
                  .then(id => shape.equivalentClasses.push(id)));
              }

              if (details.constraint) {
                shape.constraint.constraint = details.constraint.type;
                shape.constraint.comment = details.constraint.comment;

                for (const constraintShape of details.constraint.shapes) {
                  promises.push(asPromise(constraintShape, fetchClass)
                    .then(item => shape.constraint.addItem(item)));
                }
              }

              return this.$q.all(promises)
                .then(() => this.classService.createClass(shape))
                .then(() => shape);
            });
        });

    return this.addAction(result, details);
  }

  createClass(modelPromise: IPromise<Model>, details: ClassDetails): IPromise<Class> {

    const concept = details.concept;
    const conceptIdPromise = isConceptSuggestion(concept)
      ? this.createConceptSuggestion(concept, modelPromise)
      : this.$q.when(null);

    const result =
      this.$q.all([modelPromise, conceptIdPromise])
        .then(([model, conceptId]: [Model, Uri]) => this.$q.all([model, this.classService.newClass(model, details.label['fi'], conceptId, 'fi')]))
        .then(([model, klass]) => {

          const fetchClass = (id: string) => this.classService.getClass(new Uri(id, this.context), model);

          setDetails(klass, details);
          setId(klass, details);

          const promises: IPromise<any>[] = [];

          for (const property of details.properties || []) {
            promises.push(this.createProperty(modelPromise, property)
              .then(prop => klass.addProperty(prop)));
          }

          if (details.subClassOf) {
            promises.push(asIdPromise(details.subClassOf, this.context)
              .then(uri => klass.subClassOf = uri));
          }

          for (const equivalentClass of details.equivalentClasses || []) {
            promises.push(asIdPromise(equivalentClass, this.context)
              .then(uri => klass.equivalentClasses.push(uri)));
          }

          if (details.constraint) {
            klass.constraint.constraint = details.constraint.type;
            klass.constraint.comment = details.constraint.comment;

            for (const constraintShape of details.constraint.shapes) {
              promises.push(asPromise(constraintShape, fetchClass)
                .then(item => klass.constraint.addItem(item)));
            }
          }

          return this.$q.all(promises)
            .then(() => this.classService.createClass(klass))
            .then(() => klass);
        });

    return this.addAction(result, details);
  }

  assignPredicate(modelPromise: IPromise<Model>, predicatePromise: IPromise<Predicate>): IPromise<Predicate> {
    const result =
      this.$q.all([modelPromise, predicatePromise])
        .then(([model, predicate]: [Model, Predicate]) =>
          this.predicateService.assignPredicateToModel(predicate.id, model).then(() => predicate));

    return this.addAction(result, 'assign predicate');
  }

  private createPredicate<T extends Attribute|Association>(modelPromise: IPromise<Model>,
                                                           type: KnownPredicateType,
                                                           details: PredicateDetails,
                                                           mangler: (predicate: T) => IPromise<any>): IPromise<T> {

    const concept = details.concept;
    const conceptIdPromise = isConceptSuggestion(concept)
      ? this.createConceptSuggestion(concept, modelPromise)
      : this.$q.when(null);

    const result =
      this.$q.all([modelPromise, conceptIdPromise])
        .then(([model, conceptId]: [Model, Uri]) => this.predicateService.newPredicate(model, details.label['fi'], conceptId, type, 'fi'))
        .then((predicate: T) => {
          setDetails(predicate, details);
          setId(predicate, details);

          const promises: IPromise<any>[] = [];

          if (details.subPropertyOf) {
            promises.push(asIdPromise(details.subPropertyOf, this.context)
              .then(uri => predicate.subPropertyOf = uri));
          }

          for (const equivalentProperty of details.equivalentProperties || []) {
            promises.push(asIdPromise(equivalentProperty, this.context)
              .then(uri => predicate.equivalentProperties.push(uri)));
          }

          promises.push(mangler(predicate));

          return this.$q.all(promises)
            .then(() => this.predicateService.createPredicate(predicate))
            .then(() => predicate);
        });

    return this.addAction(result, details);
  }

  createAttribute(modelPromise: IPromise<Model>, details: AttributeDetails): IPromise<Attribute> {
    return this.createPredicate<Attribute>(modelPromise, 'attribute', details, attribute => {
      attribute.dataType = details.dataType || 'xsd:string';
      return this.$q.when();
    });
  }

  createAssociation(modelPromise: IPromise<Model>, details: AssociationDetails): IPromise<Association> {
    return this.createPredicate<Association>(modelPromise, 'association', details, association => {
      if (details.valueClass) {
        return asIdPromise(details.valueClass, this.context).then(uri => association.valueClass = uri);
      } else {
        return this.$q.when();
      }
    });
  }

  createProperty(modelPromise: IPromise<Model>, details: PropertyDetails): IPromise<Property> {
    const result =
      modelPromise.then(model => {
        const fetchPredicate = (id: string) => this.predicateService.getPredicate(id, model);
        return asPromise(details.predicate, fetchPredicate).then(predicate => [model, predicate])
      })
        .then(([model, predicate]: [Model, Predicate]) => {
          if (predicate.normalizedType === 'property') {
            throw new Error('Type must not be property');
          }
          return this.classService.newProperty(predicate, predicate.normalizedType, model);
        })
        .then((property: Property) => {
          setDetails(property, details);

          if (details.valueClass) {
            asIdPromise(details.valueClass, this.context).then(classId => {
              property.valueClass = classId;
            });
          }

          if (details.internalId) {
            property.internalId = Uri.fromUUID(details.internalId);
          }

          if (details.dataType) {
            property.dataType = details.dataType;
          }

          property.example = details.example ? [details.example] : [];
          property.minCount = details.minCount || null;
          property.maxCount = details.maxCount || null;
          property.pattern = details.pattern || null;

          return property;
        });

    return this.addAction(result, details);
  }
}

function failWithDetails($q: IQService, details: any): (err: any) => IPromise<never> {
  return (error: any) => {
    return $q.reject({ error, details });
  };
}

function setDetails(entity: { label: Localizable, comment: Localizable, status: Status|null }, details: EntityDetails) {
  if (details.label) {
    entity.label = details.label;
  }

  if (details.comment) {
    entity.comment = details.comment;
  }

  if (details.status) {
    entity.status = details.status;
  }
}

function setId(entity: { id: Uri }, details: { id?: string }) {
  if (details.id) {
    entity.id = entity.id.withName(details.id);
  }
}

function isPromise<T>(obj: any): obj is IPromise<T> {
  return !!(obj && obj.then);
}

function isPromiseProvider<T>(obj: any): obj is (() => IPromise<T>) {
  return typeof obj === 'function';
}

function isConceptSuggestion(obj: any): obj is ConceptSuggestionDetails {
  return typeof obj === 'object';
}

function isExternalNamespace(obj: any): obj is ExternalNamespaceDetails {
  return !!obj.label && !!obj.namespace && !!obj.prefix;
}

function isResolvable<T>(obj: any): obj is Resolvable<T> {
  return typeof obj === 'string' || isPromiseProvider(obj) || isPromise(obj);
}

function asMappedPromise<T, R>(resolvable: Resolvable<T>,
                               mapper: (input: T) => R,
                               fetchResource: (id: string) => IPromise<R>|R): IPromise<R> {
  if (isPromiseProvider<T>(resolvable)) {
    return resolvable().then(mapper);
  } else if (isPromise<T>(resolvable)) {
    return resolvable.then(mapper);
  } else {
    const result = fetchResource(resolvable);
    if (isPromise(result)) {
      return result;
    } else {
      return <IPromise<R>> <any> Promise.resolve(result);
    }
  }
}

function asPromise<T>(resolvable: Resolvable<T>, fetchResource: (id: string) => IPromise<T>): IPromise<T> {
  return asMappedPromise(resolvable, identity, fetchResource);
}

function asIdPromise<T extends { id: Uri }>(resolvable: Resolvable<T>, context: any): IPromise<Uri> {
  return asMappedPromise(resolvable, item => item.id, id => new Uri(id, context));
}

function asUuidPromise<T extends { id: Uri }>(resolvable: Resolvable<T>): IPromise<string> {
  return asMappedPromise(resolvable, item => item.id.uuid, identity);
}

function asIdentifierPromise<T extends { identifier: string }>(resolvable: Resolvable<T>): IPromise<string> {
  return asMappedPromise(resolvable, item => item.identifier, identity);
}
