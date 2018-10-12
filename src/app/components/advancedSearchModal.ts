import { IPromise, IScope } from 'angular';
import { IModalService, IModalServiceInstance } from 'angular-ui-bootstrap';
import { SearchService } from 'app/services/searchService';
import { LanguageService, Localizer } from 'app/services/languageService';
import { SearchController, SearchFilter } from 'app/types/filter';
import { Type } from 'app/types/entity';
import { availableUILanguages, LanguageContext } from 'app/types/language';
import { SearchResult } from 'app/entities/search';
import { filterAndSortSearchResults, defaultLabelComparator } from './filter/util';
import { Uri } from 'app/entities/uri';

export const languageContext: LanguageContext = {
  id: new Uri('http://advanvedSearch', {}),
  language: availableUILanguages
};

export class AdvancedSearchModal {
  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  open(): IPromise<SearchResult> {
    return this.$uibModal.open({
      template: require('./advancedSearchModal.html'),
      size: 'md',
      controller: AdvancedSearchController,
      controllerAs: '$ctrl'
    }).result;
  }
}

class AdvancedSearchController implements SearchController<SearchResult> {

  private apiSearchResults: SearchResult[] = [];

  searchResults: SearchResult[];
  types: Type[] = ['model', 'class', 'shape', 'attribute', 'association'];
  searchText = '';
  loadingResults: boolean;
  private localizer: Localizer;

  contentExtractors = [ (searchResult: SearchResult) => searchResult.label, (searchResult: SearchResult) => searchResult.comment ];
  private searchFilters: SearchFilter<SearchResult>[] = [];

  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              private searchService: SearchService,
              languageService: LanguageService) {
    'ngInject';

    this.localizer = languageService.createLocalizer(languageContext);    

    $scope.$watch(() => this.searchText, text => {      
      if (text) {
        this.loadingResults = true;

        this.searchService.searchAnything(text)
          .then(results => this.apiSearchResults = results)
          .then(() => {
            this.search();
            this.loadingResults = false;
          });
      } else {
        this.apiSearchResults = [];
        this.search();
      }   
    });
  }

  close() {
    this.$uibModalInstance.dismiss('cancel');
  }

  addFilter(filter: SearchFilter<SearchResult>) {
    this.searchFilters.push(filter);
  }

  get items() {
    return this.apiSearchResults;
  }

  get context() {
    return this.localizer.context;
  }

  search() {
    this.searchResults =
      filterAndSortSearchResults<SearchResult>(
        this.apiSearchResults,
        this.searchText,
        this.contentExtractors,
        this.searchFilters,
        defaultLabelComparator(this.localizer)
      );
  }

  selectSearchResult(searchResult: SearchResult) {
    if (searchResult.iowUrl) {
      this.$uibModalInstance.close(searchResult);
    }
  };
}
