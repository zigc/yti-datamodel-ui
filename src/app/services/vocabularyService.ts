import { IHttpService, IPromise } from 'angular';
import { upperCaseFirst } from 'change-case';
import { config } from 'config';
import { Uri, Url } from 'app/entities/uri';
import { Language } from 'app/types/language';
import { FrameService } from './frameService';
import { GraphData } from 'app/types/entity';
import * as frames from 'app/entities/frames';
import { Vocabulary, Concept } from 'app/entities/vocabulary';
import { Model } from 'app/entities/model';

export interface VocabularyService {
  getAllVocabularies(): IPromise<Vocabulary[]>;
  searchConcepts(searchText: string, vocabulary?: Vocabulary): IPromise<Concept[]>;
  createConceptSuggestion(vocabulary: Vocabulary, label: string, comment: string, lang: Language, model: Model): IPromise<Uri>;
  getConcept(id: Uri): IPromise<Concept>;
}

export class DefaultVocabularyService implements VocabularyService {
  /* @ngInject */
  constructor(private $http: IHttpService,
              private frameService: FrameService) {
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
      params.graphId = vocabulary.vocabularyGraph;
    }

    return this.$http.get<GraphData>(config.apiEndpointWithName('conceptSearch'), { params })
      .then(response => this.deserializeConcepts(response.data!));
  }

  createConceptSuggestion(vocabulary: Vocabulary, label: string, definition: string, lang: Language, model: Model): IPromise<Uri> {
    return this.$http.put<{ identifier: string }>(config.apiEndpointWithName('conceptSuggestion'), null, {
      params: {
        graphUUID: vocabulary.vocabularyGraph,
        label: upperCaseFirst(label),
        comment: definition,
        lang,
        modelID: model.id.uri
      }})
      .then(response => new Uri(response.data!.identifier, {}));
  }

  getConcept(id: Uri): IPromise<Concept> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('concept'), {params: {id: id.isUuid() ? id.uuid : id.uri}})
      .then(response => this.deserializeConcept(response.data!, id.uri));
  }

  deserializeConcept(data: GraphData, id: Url): IPromise<Concept> {
    return this.frameService.frameAndMap(data, true, frames.conceptFrame(data, id), () => Concept);
  }

  deserializeConcepts(data: GraphData): IPromise<Concept[]> {
    return this.frameService.frameAndMapArray(data, frames.conceptListFrame(data), () => Concept);
  }

  deserializeVocabularies(data: GraphData): IPromise<Vocabulary[]> {
    return this.frameService.frameAndMapArray(data, frames.vocabularyFrame(data), () => Vocabulary);
  }
}
