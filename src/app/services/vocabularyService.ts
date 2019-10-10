import { IHttpService, IPromise } from 'angular';
import { upperCaseFirst } from 'change-case';
import { apiEndpointWithName } from './config';
import { Uri, Url } from 'app/entities/uri';
import { Language } from 'app/types/language';
import { FrameService } from './frameService';
import { GraphData } from 'app/types/entity';
import * as frames from 'app/entities/frames';
import { Vocabulary, Concept } from 'app/entities/vocabulary';
import { Model } from 'app/entities/model';
import { requireDefined } from 'yti-common-ui/utils/object';

export interface VocabularyService {
  getAllVocabularies(): IPromise<Vocabulary[]>;

  searchConcepts(searchText: string, vocabulary?: Vocabulary): IPromise<Concept[]>;

  createConceptSuggestion(vocabulary: Vocabulary, label: string, comment: string, lang: Language, model: Model): IPromise<Uri>;

  getConcept(id: Uri): IPromise<Concept>;
}

export class DefaultVocabularyService implements VocabularyService {

  constructor(private $http: IHttpService,
              private frameService: FrameService) {
    'ngInject';
  }

  getAllVocabularies(): IPromise<Vocabulary[]> {
    return this.$http.get<GraphData>(apiEndpointWithName('conceptSchemes'))
      .then(response => this.deserializeVocabularies(response.data!));
  }

  searchConcepts(searchText: string, vocabulary?: Vocabulary): IPromise<Concept[]> {

    const params: any = {
      // XXX: api wants search strings as lower case otherwise it finds nothing
      term: (searchText ? searchText.toLowerCase() : '')
    };

    if (vocabulary) {
      params.terminologyUri = vocabulary.id.uri
    }

    return this.$http.get<GraphData>(apiEndpointWithName('conceptSearch'), { params })
      .then(response => this.deserializeConcepts(response.data!));
  }

  createConceptSuggestion(vocabulary: Vocabulary, label: string, definition: string, lang: Language, model: Model): IPromise<Uri> {
    return this.$http.put<{ identifier: string }>(apiEndpointWithName('conceptSuggestion'), null, {
      params: {
        terminologyUri: vocabulary.id.uri,
        label: upperCaseFirst(label),
        comment: definition,
        lang,
      }
    })
      .then(response => new Uri(response.data!.identifier, {}));
  }

  getConcept(id: Uri): IPromise<Concept> {
    return this.$http.get<GraphData>(apiEndpointWithName('concept'), {
      params: { uri: id.uri }
    })
      .then(response => this.deserializeConcept(response.data!, id.uri));
  }

  deserializeConcept(data: GraphData, id: Url): IPromise<Concept> {
    return this.frameService.frameAndMap(data, false, frames.conceptFrame(data, id), () => Concept).then(requireDefined);
  }

  deserializeConcepts(data: GraphData): IPromise<Concept[]> {
    return this.frameService.frameAndMapArray(data, frames.conceptListFrame(data), () => Concept);
  }

  deserializeVocabularies(data: GraphData): IPromise<Vocabulary[]> {
    return this.frameService.frameAndMapArray(data, frames.vocabularyFrame(data), () => Vocabulary);
  }
}
