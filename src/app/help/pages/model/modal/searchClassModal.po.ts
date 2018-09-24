import { child, modal } from 'app/help/utils/selector';
import * as Modal from 'app/help/pages/modal/modal.po';
import * as SearchModal from 'app/help/pages/modal/searchModal.po';
import * as SearchConceptModal from './searchConceptModal.po';
import { Story } from 'app/help/contract';

const searchClassModal = child(modal, '.search-class');

export function filterForClass(className: string, classId: string) {
  return SearchModal.filterForSearchResult(searchClassModal, className, classId, true);
}

export function filterForNewClass(className: string, abbreviate: boolean) {
  return SearchModal.filterForAddNewResult(searchClassModal, className, 'class', abbreviate);
}

export function selectClass(className: string, classId: string) {
  return SearchModal.selectSearchResult(searchClassModal, className, classId, true);
}

export const selectAddNewClassSearchResult = SearchModal.selectAddNewResult(searchClassModal, 0, 'Select new creation');

export const focusSelectedClass = SearchModal.focusSearchSelection(searchClassModal, 'Class is here', 'Class is here info');

export const confirmClassSelection = (navigates: boolean) => Modal.confirm(searchClassModal, navigates);

export const UseCases = {

  findAndSelectExistingClass(className: string, classId: string, navigates: boolean): Story[] {
    return [
      filterForClass(className, classId),
      selectClass(className, classId),
      focusSelectedClass,
      confirmClassSelection(navigates)
    ];
  },
  findAndCreateNewBasedOnConceptSuggestion(name: string, comment: string): Story[] {
    return [
      filterForNewClass(name, true),
      selectAddNewClassSearchResult,
      ...SearchConceptModal.UseCases.findAndCreateNewSuggestion(name, comment, true)
    ];
  }
};
