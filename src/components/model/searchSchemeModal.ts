import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { ConceptService } from '../../services/conceptService';
import { Language } from '../../services/languageService';
import { Uri } from '../../services/entities';
import gettextCatalog = angular.gettext.gettextCatalog;


export class SearchSchemeModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(excludedSchemes: Set<Uri>, language: Language): IPromise<any> {
    return this.$uibModal.open({
      template: require('./searchSchemeModal.html'),
      size: 'medium',
      controller: SearchSchemeController,
      controllerAs: 'ctrl',
      backdrop: false,
      resolve: {
        excludedSchemes: () => excludedSchemes,
        language: () => language
      }
    }).result;
  }
}

class SearchResult {
  constructor(public scheme: any, public disabled: boolean) {}
}

class SearchSchemeController {

  searchResults: SearchResult[];
  schemes: any[];
  searchText: string = '';

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              private excludedSchemes: Set<Uri>,
              private conceptService: ConceptService,
              private language: Language,
              private gettextCatalog: gettextCatalog) {

    conceptService.getAllSchemes(language).then(result => {
      this.schemes = result.data.vocabularies;
      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
  }

  search() {
    this.searchResults = _.chain(this.schemes)
      .filter(scheme => this.textFilter(scheme))
      .sortBy(scheme => scheme.title)
      .map(scheme => new SearchResult(scheme, this.excludedSchemes.has(scheme.id)))
      .value();
  }

  selectSearchResult(searchResult: SearchResult) {
    if (!searchResult.disabled) {
      this.$uibModalInstance.close(searchResult.scheme);
    }
  }

  searchResultTitle(searchResult: SearchResult) {
    if (searchResult.disabled) {
      return this.gettextCatalog.getString('Already added');
    }
  }

  private textFilter(scheme: any): boolean {
    return !this.searchText || (scheme.title || '').toLowerCase().includes(this.searchText.toLowerCase());
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}
