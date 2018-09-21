import { confirm } from 'app/help/pages/modal/modalHelp.po';
import { filterForAddNewResult, filterForSearchResult, focusSearchSelection, selectAddNewResult, selectSearchResult } from 'app/help/pages/modal/searchModalHelp.po';
import { child, modal } from 'app/help/selectors';
import * as SearchConceptModal from './searchConceptModalHelp.po';
import { Story } from 'app/help/contract';

const searchClassModal = child(modal, '.search-class');

export function filterForClass(className: string, classId: string) {
  return filterForSearchResult(searchClassModal, className, classId, true);
}

export function filterForNewClass(className: string, abbreviate: boolean) {
  return filterForAddNewResult(searchClassModal, className, 'class', abbreviate);
}

export function selectClass(className: string, classId: string) {
  return selectSearchResult(searchClassModal, className, classId, true);
}

export const selectAddNewClassSearchResult = selectAddNewResult(searchClassModal, 0, 'Select new creation');

export const focusSelectedClass = focusSearchSelection(searchClassModal, 'Class is here', 'Class is here info');

export const confirmClassSelection = (navigates: boolean) => confirm(searchClassModal, navigates);

export function findAndSelectExistingClassItems(className: string, classId: string, navigates: boolean): Story[] {
  return [
    filterForClass(className, classId),
    selectClass(className, classId),
    focusSelectedClass,
    confirmClassSelection(navigates)
  ];
}

export function findAndCreateNewBasedOnConceptSuggestionItems(name: string, comment: string): Story[] {
  return [
    filterForNewClass(name, true),
    selectAddNewClassSearchResult,
    ...SearchConceptModal.findAndCreateNewSuggestionItems(name, comment, true)
  ];
}
