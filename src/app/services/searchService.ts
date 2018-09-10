import { IPromise, IHttpService } from 'angular';
import { Language } from 'app/types/language';
import { GraphData } from 'app/types/entity';
import { FrameService } from './frameService';
import { searchResultFrame } from 'app/entities/frames';
import { SearchResult } from 'app/entities/search';
import { apiEndpointWithName } from './config';

export class SearchService {

  /* @ngInject */
  constructor(private $http: IHttpService, private frameService: FrameService) {
  }

  search(graph: string, search: string, language?: Language): IPromise<SearchResult[]> {
    return this.$http.get<GraphData>(apiEndpointWithName('search'), {params: {graph, search, lang: language}})
      .then(response => this.deserializeSearch(response.data!));
  }

  searchAnything(search: string, language?: Language): IPromise<SearchResult[]> {
    return this.$http.get<GraphData>(apiEndpointWithName('search'), {
        params: {
          graph: 'default',
          search,
          lang: language
        }
      })
      .then(response => this.deserializeSearch(response.data!));
  }

  private deserializeSearch(data: GraphData): IPromise<SearchResult[]> {
    return this.frameService.frameAndMapArray(data, searchResultFrame(data), () => SearchResult);
  }
}
