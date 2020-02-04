import { IPromise, IQService } from 'angular';
import { PredicateService } from '../../services/predicateService';
import { ResetableService } from './resetableService';
import { Association, Attribute, Predicate } from '../../entities/predicate';
import { Model } from '../../entities/model';
import { Uri, Urn } from '../../entities/uri';
import { DataSource } from '../../components/form/dataSource';
import { KnownPredicateType } from '../../types/entity';
import { Language } from '../../types/language';
import * as moment from 'moment';
import { VocabularyService } from '../../services/vocabularyService';
import { ModelResourceStore } from './resourceStore';
import { Concept } from '../../entities/vocabulary';
import { flatten } from 'yti-common-ui/utils/array';
import { EntityCreatorService } from './entityCreatorService';
import { RelatedPredicate } from '../../services/predicateService';

export class InteractiveHelpPredicateService implements PredicateService, ResetableService {

  private store = new ModelResourceStore<Predicate>(this.$q);

  constructor(private $q: IQService,
              private entityCreatorService: EntityCreatorService,
              private helpVocabularyService: VocabularyService) {
    'ngInject';
  }

  reset(): IPromise<any> {
    this.store.clear();
    return this.$q.when();
  }

  getPredicate(id: Uri|Urn, model: Model): IPromise<Predicate> {
    return this.$q.when(this.store.getResourceForAnyModelById(id));
  }

  getAllPredicates(model: Model): IPromise<Predicate[]> {
    return this.$q.when(this.store.getResourceValuesForAllModels());
  }

  getRequiredByPredicates(model: Model): IPromise<Predicate[]> {
    throw new Error('getRequiredByPredicates is not yet implemented in help');
  }

  getPredicatesForModel(model: Model): IPromise<Predicate[]> {
    return this.store.getAllResourceValuesForModel(model);
  }

  getPredicatesForModelDataSource(modelProvider: () => Model): DataSource<Predicate> {
    return (_search: string) => this.getPredicatesForModel(modelProvider());
  }

  getPredicatesAssignedToModel(model: Model): IPromise<Predicate[]> {
    return this.store.getAllResourceValuesForModel(model);
  }

  createPredicate(predicate: Predicate): IPromise<any> {
    predicate.unsaved = false;
    predicate.createdAt = moment();
    this.store.addResourceToModel(predicate.definedBy, predicate);
    return this.$q.when(predicate);
  }

  updatePredicate(predicate: Predicate, originalId: Uri): IPromise<any> {
    predicate.modifiedAt = moment();
    this.store.updateResourceInModel(predicate.definedBy, predicate, originalId.uri);
    return this.$q.when(predicate);
  }

  deletePredicate(id: Uri, model: Model): IPromise<any> {
    this.store.deleteResourceFromModel(model, id.uri);
    return this.$q.when();
  }

  assignPredicateToModel(predicateId: Uri, model: Model): IPromise<any> {
    this.store.assignResourceToModel(model, predicateId.uri);
    return this.$q.when();
  }

  newPredicate<T extends Attribute|Association>(model: Model, predicateLabel: string, conceptID: Uri|null, type: KnownPredicateType, lang: Language): IPromise<T> {

    const conceptPromise: IPromise<Concept|null> = conceptID ? this.helpVocabularyService.getConcept(conceptID) : this.$q.when(null);

    return conceptPromise
      .then(concept => {
        return this.entityCreatorService.createPredicate({
          type: type,
          model: model,
          lang: lang,
          label: predicateLabel,
          concept: concept ? concept : undefined
        }).then(predicate => {
          predicate.unsaved = true;
          return predicate as T;
        });
      });
  }

  newRelatedPredicate<T extends Attribute|Association>(model: Model, relatedClass: RelatedPredicate): IPromise<T> {
    throw new Error('newRelatedPredicate is not yet implemented in help');
  }

  changePredicateType(predicate: Attribute|Association, newType: KnownPredicateType, model: Model): IPromise<Attribute|Association> {
    throw new Error('changePredicateType is not yet supported in help');
  }

  copyPredicate(predicate: Predicate|Uri, type: KnownPredicateType, model: Model): IPromise<Predicate> {
    throw new Error('copyPredicate is not yet supported in help');
  }

  getExternalPredicate(externalId: Uri, model: Model): IPromise<Predicate|null> {
    return this.$q.when(this.store.findExternalResource(externalId));
  }

  getExternalPredicatesForModel(model: Model): IPromise<Predicate[]> {
    const externalNamespaces = model.importedNamespaces.filter(ns => ns.external);
    const externalResources = flatten(externalNamespaces.map(ns => this.store.getExternalResourcesForNamespace(ns.url)));
    return this.$q.when(externalResources);
  }

  predicateExists(id: Uri) {
    return this.store.getResourcesForAllModels().has(id.toString());
  }

  clearCachedPredicates(modelId: string): void {}
}
