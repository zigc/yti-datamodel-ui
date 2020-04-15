import { IHttpService, IPromise, IQService } from 'angular';
import * as moment from 'moment';
import { upperCaseFirst } from 'change-case';
import { KnownPredicateType, PredicateRelationType } from '../types/entity';
import { reverseMapType } from '../utils/entity';
import { Urn, Uri } from '../entities/uri';
import { expandContextWithKnownModels } from '../utils/entity';
import { Language } from '../types/language';
import { DataSource } from '../components/form/dataSource';
import { modelScopeCache } from '../components/form/cache';
import { requireDefined } from 'yti-common-ui/utils/object';
import { FrameService } from './frameService';
import { GraphData, EntityFactory } from '../types/entity';
import * as frames from '../entities/frames';
import { containsAny, flatten } from 'yti-common-ui/utils/array';
import { PredicateListItem, Predicate, Attribute, Association } from '../entities/predicate';
import { Model } from '../entities/model';
import { typeSerializer } from '../entities/serializer/serializer';
import { apiEndpointWithName } from './config';

export class RelatedPredicate {
  constructor(public oldPredicateId: Uri, public relationType: PredicateRelationType) {
  }
}

export interface PredicateService {
  getPredicate(id: Uri|Urn, model?: Model): IPromise<Predicate>;
  getAllPredicates(model: Model): IPromise<PredicateListItem[]>;
  getRequiredByPredicates(model: Model): IPromise<PredicateListItem[]>;
  getPredicatesForModel(model: Model): IPromise<PredicateListItem[]>;
  getPredicatesForModelDataSource(modelProvider: () => Model, requiredByInUse?: boolean): DataSource<PredicateListItem>;
  getPredicatesAssignedToModel(model: Model): IPromise<PredicateListItem[]>;
  createPredicate(predicate: Predicate): IPromise<any>;
  updatePredicate(predicate: Predicate, originalId: Uri, model: Model): IPromise<any>;
  deletePredicate(id: Uri, model: Model): IPromise<any>;
  assignPredicateToModel(predicateId: Uri, model: Model): IPromise<any>;
  newPredicate<T extends Attribute|Association>(model: Model, predicateLabel: string, conceptID: Uri|null, type: KnownPredicateType, lang: Language): IPromise<T>;
  newRelatedPredicate<T extends Attribute|Association>(model: Model, relatedPredicate: RelatedPredicate): IPromise<T>;
  changePredicateType(predicate: Attribute|Association, newType: KnownPredicateType, model: Model): IPromise<Attribute|Association>;
  copyPredicate(predicate: Predicate|Uri, type: KnownPredicateType, model: Model): IPromise<Predicate>;
  getExternalPredicate(externalId: Uri, model: Model): IPromise<Predicate|null>;
  getExternalPredicatesForModel(model: Model): IPromise<PredicateListItem[]>;
  clearCachedPredicates(modelId: string): void;
}

export class DefaultPredicateService implements PredicateService {

  private modelPredicatesCache = new Map<string, PredicateListItem[]>();

  constructor(private $http: IHttpService, private $q: IQService, private frameService: FrameService) {
    'ngInject';
  }

  getPredicate(id: Uri|Urn, model?: Model): IPromise<Predicate> {
    return this.$http.get<GraphData>(apiEndpointWithName('predicate'), {params: {id: id.toString()}})
      .then(response => this.deserializePredicate(response.data!, false))
      .then(predicate => requireDefined(predicate));
  }

  getAllPredicates(model: Model): IPromise<PredicateListItem[]> {
    return this.$http.get<GraphData>(apiEndpointWithName('predicate'))
      .then(response => this.deserializePredicateList(response.data!));
  }

  getRequiredByPredicates(model: Model): IPromise<PredicateListItem[]> {
    return this.$http.get<GraphData>(apiEndpointWithName('predicate'), {params: {requiredBy: model.id.uri}})
      .then(response => this.deserializePredicateList(response.data!));
  }

  getPredicatesForModel(model: Model) {
    return this.getAllPredicates(model).then(predicates => predicates.filter(predicate => predicate.id.resolves()));  // if resolves, it is known namespace
  }

  getPredicatesForModelDataSource(modelProvider: () => Model, requiredByInUse: boolean = false): DataSource<PredicateListItem> {

    const cachedResultsProvider = modelScopeCache(modelProvider,  model => {
      return this.$q.all([
        requiredByInUse ? this.getRequiredByPredicates(model) : this.getPredicatesForModel(model),
        this.getExternalPredicatesForModel(model)
      ]).then(flatten);
    });

    return () => cachedResultsProvider();
  }

  getPredicatesAssignedToModel(model: Model): IPromise<PredicateListItem[]> {

    const predicates = this.modelPredicatesCache.get(model.id.uri);

    if (predicates) {
      return this.$q.when(predicates);
    } else {
      return this.$http.get<GraphData>(apiEndpointWithName('predicate'), {params: {model: model.id.uri}})
        .then(response => this.deserializePredicateList(response.data!))
        .then(predicateList => {
          this.modelPredicatesCache.set(model.id.uri, predicateList);
          return predicateList;
        });
    }
  }

  createPredicate(predicate: Predicate): IPromise<any> {
    const requestParams = {
      id: predicate.id.uri,
      model: predicate.definedBy.id.uri
    };
    return this.$http.put<{ identifier: Urn }>(apiEndpointWithName('predicate'), predicate.serialize(), {params: requestParams})
      .then(response => {
        this.modelPredicatesCache.delete(predicate.definedBy.id.uri);
        predicate.unsaved = false;
        predicate.version = response.data!.identifier;
        predicate.createdAt = moment().utc();
        predicate.modifiedAt = moment().utc();
      });
  }

  updatePredicate(predicate: Predicate, originalId: Uri, model: Model): IPromise<any> {
    const requestParams: any = {
      id: predicate.id.uri,
      model: predicate.definedBy.id.uri
    };
    if (predicate.id.notEquals(originalId)) {
      requestParams.oldid = originalId.uri;
    }
    model.expandContextWithKnownModels(predicate.context);

    return this.$http.post<{ identifier: Urn }>(apiEndpointWithName('predicate'), predicate.serialize(), {params: requestParams})
      .then(response => {
        predicate.version = response.data!.identifier;
        predicate.modifiedAt = moment().utc();
      })
      .then(() => this.modelPredicatesCache.delete(predicate.definedBy.id.uri));
  }

  deletePredicate(id: Uri, model: Model): IPromise<any> {
    const requestParams = {
      id: id.uri,
      model: model.id.uri
    };
    return this.$http.delete(apiEndpointWithName('predicate'), {params: requestParams})
      .then(() => this.modelPredicatesCache.delete(model.id.uri));
  }

  clearCachedPredicates(modelId: string): void {
    this.modelPredicatesCache.delete(modelId);
  }

  assignPredicateToModel(predicateId: Uri, model: Model): IPromise<any> {
    const requestParams = {
      id: predicateId.uri,
      model: model.id.uri
    };
    return this.$http.post(apiEndpointWithName('predicate'), undefined, {params: requestParams})
      .then(() => this.modelPredicatesCache.delete(model.id.uri));
  }

  newPredicate<T extends Attribute|Association>(model: Model, predicateLabel: string, conceptID: Uri|null, type: KnownPredicateType, lang: Language): IPromise<T> {

    const params: any = {
      modelID: model.id.uri,
      predicateLabel: upperCaseFirst(predicateLabel),
      type: reverseMapType(type),
      lang
    };

    if (conceptID !== null) {
      params.conceptID = conceptID.uri;
    }

    return this.$http.get<GraphData>(apiEndpointWithName('predicateCreator'), {params})
      .then(expandContextWithKnownModels(model))
      .then(response => this.deserializePredicate(response.data!, false))
      .then((predicate: T) => {
        predicate.definedBy = model.asDefinedBy();
        if (predicate instanceof Attribute && !predicate.dataType) {
          predicate.dataType = 'xsd:string';
        }
        predicate.unsaved = true;
        return predicate;
      });
  }

  newRelatedPredicate<T extends Attribute|Association>(model: Model, relatedPredicate: RelatedPredicate): IPromise<T> {

    const params: any = {
      modelID: model.id.uri,
      oldPredicate: relatedPredicate.oldPredicateId.uri,
      relationType: relatedPredicate.relationType
    };

    return this.$http.get<GraphData>(apiEndpointWithName('relatedPredicateCreator'), {params})
      .then(expandContextWithKnownModels(model))
      .then(response => this.deserializePredicate(response.data!, false))
      .then((predicate: T) => {
        predicate.definedBy = model.asDefinedBy();
        if (predicate instanceof Attribute && !predicate.dataType) {
          predicate.dataType = 'xsd:string';
        }
        predicate.unsaved = true;
        return predicate;
      });
  }

  changePredicateType(predicate: Attribute|Association, newType: KnownPredicateType, model: Model) {
    return this.newPredicate(model, '', null, newType, 'sl')
      .then(changedPredicate => {
        changedPredicate.id = predicate.id;
        changedPredicate.label = predicate.label;
        changedPredicate.comment = predicate.comment;
        changedPredicate.createdAt = predicate.createdAt;
        changedPredicate.modifiedAt = predicate.modifiedAt;
        changedPredicate.editorialNote = predicate.editorialNote;
        changedPredicate.status = predicate.status;
        changedPredicate.unsaved = predicate.unsaved;
        changedPredicate.subject = predicate.subject;
        return changedPredicate;
      });
  }

  copyPredicate(predicate: Predicate|Uri, type: KnownPredicateType, model: Model) {

    function newEmptyPredicate(): Attribute|Association {

      const graph = {
        '@id': id.uri,
        '@type': reverseMapType(type),
        versionInfo: 'Unstable',
        isDefinedBy: model.asDefinedBy().serialize(true)
      };

      const frameData = { '@graph': graph, '@context': model.context };
      const frame: any = frames.predicateFrame(frameData);

      const newPredicate = type === 'attribute' ? new Attribute(graph, frame['@context'], frame)
        : new Association(graph, frame['@context'], frame);

      newPredicate.unsaved = true;
      newPredicate.createdAt = moment().utc();
      newPredicate.modifiedAt = moment().utc();

      return newPredicate;
    }

    const oldId = predicate instanceof Uri ? predicate : predicate.id;
    const id = new Uri(model.namespace + oldId.name, model.context);
    const copied = newEmptyPredicate();

    if (predicate instanceof Predicate) {
      copied.label = predicate.label;
      copied.comment = predicate.comment;
      copied.subPropertyOf = predicate.subPropertyOf;
      copied.subject = predicate.subject;
      copied.equivalentProperties = predicate.equivalentProperties;
    }

    if (copied instanceof Association && predicate instanceof Association) {
      copied.valueClass = predicate.valueClass;
    }

    if (copied instanceof Attribute && predicate instanceof Attribute) {
      copied.dataType = predicate.dataType;
    }

    return this.$q.when(copied);
  }

  getExternalPredicate(externalId: Uri, model: Model) {
    return this.$http.get<GraphData>(apiEndpointWithName('externalPredicate'), {params: {model: model.id.uri, id: externalId.uri}})
      .then(response => this.deserializePredicate(response.data!, true))
      .then(predicate => {
        if (predicate) {
          predicate.external = true;
        }
        return predicate;
      });
  }

  getExternalPredicatesForModel(model: Model) {
    return this.$http.get<GraphData>(apiEndpointWithName('externalPredicate'), {params: {model: model.id.uri}})
      .then(response => this.deserializePredicateList(response.data!));
  }

  private deserializePredicateList(data: GraphData): IPromise<PredicateListItem[]> {
    return this.frameService.frameAndMapArray(data, frames.predicateListFrame(data), () => PredicateListItem);
  }

  private deserializePredicate(data: GraphData, optional: boolean): IPromise<Attribute|Association|Predicate|null> {

    const entityFactory: EntityFactory<Predicate> = (framedData) => {
      const types = typeSerializer.deserialize(framedData['@graph'][0]['@type']);

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

    return this.frameService.frameAndMap(data, optional, frames.predicateFrame(data), entityFactory);
  }
}
