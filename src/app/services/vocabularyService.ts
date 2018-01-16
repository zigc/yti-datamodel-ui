import { IHttpService, IPromise, IQService } from 'angular';
import { upperCaseFirst } from 'change-case';
import { config } from 'config';
import { Uri, Url } from 'app/entities/uri';
import { Language } from 'app/types/language';
import { FrameService } from './frameService';
import { GraphData } from 'app/types/entity';
import * as frames from 'app/entities/frames';
import { Vocabulary, Concept } from 'app/entities/vocabulary';
import { Model } from 'app/entities/model';
import { requireSingle } from 'yti-common-ui/utils/array';

export interface VocabularyService {
  getAllVocabularies(): IPromise<Vocabulary[]>;
  searchConcepts(searchText: string, vocabulary?: Vocabulary): IPromise<Concept[]>;
  createConceptSuggestion(vocabulary: Vocabulary, label: string, comment: string, lang: Language, model: Model): IPromise<Concept>;
  getConcept(id: Uri): IPromise<Concept>;
  getConceptsForModel(model: Model): IPromise<Concept[]>;
}

export class DefaultVocabularyService implements VocabularyService {
  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService, private frameService: FrameService) {
  }

  getAllVocabularies(): IPromise<Vocabulary[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('conceptSchemes'))
      .then(response => this.deserializeVocabularies(response.data!));
  }

  searchConcepts(searchText: string, vocabulary?: Vocabulary): IPromise<Concept[]> {

    const params: any = {
      // XXX: api wants search strings as lower case otherwise it finds nothing
      term: (searchText ? searchText.toLowerCase() : '') + '*'
    };

    if (vocabulary) {
      params.schemeURI = vocabulary.id.toString();
    }

    return this.$http.get<GraphData>(config.apiEndpointWithName('conceptSearch'), { params })
      .then(response => this.deserializeConcepts(response.data!));
  }

  createConceptSuggestion(vocabulary: Vocabulary, label: string, comment: string, lang: Language, model: Model): IPromise<Concept> {
    return this.$http.put<GraphData>(config.apiEndpointWithName('conceptSuggestion'), null, {
      params: {
        schemeID: vocabulary.id.uri,
        graphUUID: vocabulary.graph,
        label: upperCaseFirst(label),
        comment,
        lang,
        modelID: model.id.uri
      }})
      .then(response => this.deserializeConcepts(response.data!))
      .then(concepts => requireSingle(concepts));
  }

  getConcept(id: Uri): IPromise<Concept> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('concept'), {params: {uri: id.uri}})
      .then(response => {
        // XXX: api should be fixed to return non success code when concept not found
        // but this might not be relevant with ongoing term editor project
        if (!response.data || !response.data['@graph']) {
          return this.$q.reject();
        } else {
          return this.deserializeConcept(response.data!, id.uri);
        }
      });
  }

  getConceptsForModel(model: Model): IPromise<Concept[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('modelConcepts'), {params: {model: model.id.uri}})
      .then(response => this.deserializeModelConcepts(response.data!));
  }

  deserializeConcept(data: GraphData, id: Url): IPromise<Concept> {
    return this.frameService.frameAndMap(data, true, frames.conceptFrame(data, id), () => Concept);
  }

  deserializeConcepts(data: GraphData): IPromise<Concept[]> {
    return this.frameService.frameAndMapArray(data, frames.conceptListFrame(data), () => Concept);
  }

  deserializeModelConcepts(data: GraphData): IPromise<Concept[]> {
    return this.frameService.frameAndMapArray(data, frames.conceptListFrame(data), () => Concept);
  }

  deserializeVocabularies(data: GraphData): IPromise<Vocabulary[]> {
    return this.frameService.frameAndMapArray(data, frames.vocabularyFrame(data), () => Vocabulary);
  }
}
