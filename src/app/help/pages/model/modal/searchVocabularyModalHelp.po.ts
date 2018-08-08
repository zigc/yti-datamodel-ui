import { filterForSearchResult, selectSearchResult } from 'app/help/pages/modal/searchModalHelp.po';
import { modal, child } from 'app/help/selectors';
import gettextCatalog = angular.gettext.gettextCatalog;

const searchVocabularyModal = child(modal, '.search-vocabulary');

export function filterForVocabulary(label: string, vocabularyId: string, gettextCatalog: gettextCatalog) {
  return filterForSearchResult(searchVocabularyModal, label, vocabularyId, gettextCatalog);
}

export function selectVocabualry(label: string, vocabularyId: string) {
  return selectSearchResult(searchVocabularyModal, label, vocabularyId, false);
}
