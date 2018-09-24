import * as SearchModal from 'app/help/pages/modal/searchModal.po';
import { child, modal } from 'app/help/utils/selector';
import { Story } from 'app/help/contract';

const searchVocabularyModal = child(modal, '.search-vocabulary');

export function filterForVocabulary(name: string, vocabularyId: string) {
  return SearchModal.filterForSearchResult(searchVocabularyModal, name, vocabularyId, true);
}

export function selectVocabulary(label: string, vocabularyId: string) {
  return SearchModal.selectSearchResult(searchVocabularyModal, label, vocabularyId, false);
}

export const UseCases = {
    filterAndSelect(label: string, vocabularyId: string): Story[] {
      return [
        filterForVocabulary(label, vocabularyId),
        selectVocabulary(label, vocabularyId),
      ]
    }
};
