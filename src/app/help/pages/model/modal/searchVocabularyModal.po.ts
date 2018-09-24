import { filterForSearchResult, selectSearchResult } from 'app/help/pages/modal/searchModal.po';
import { child, modal } from 'app/help/utils/selector';

const searchVocabularyModal = child(modal, '.search-vocabulary');

export function filterForVocabulary(name: string, vocabularyId: string) {
  return filterForSearchResult(searchVocabularyModal, name, vocabularyId, true);
}

export function selectVocabulary(label: string, vocabularyId: string) {
  return selectSearchResult(searchVocabularyModal, label, vocabularyId, false);
}
