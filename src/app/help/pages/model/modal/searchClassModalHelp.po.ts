import { confirm } from 'app/help/pages/modal/modalHelp.po';
import {
  filterForSearchResult, selectSearchResult, focusSearchSelection,
  filterForAddNewResult, selectAddNewResult
} from 'app/help/pages/modal/searchModalHelp.po';
import { modal, child } from 'app/help/selectors';
import { classIdFromNamespaceId } from 'app/help/utils';
import * as SearchConceptModal from './searchConceptModalHelp.po';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { Story } from 'app/help/contract';

const searchClassModal = child(modal, '.search-class');

export function filterForClass(namespaceId: string, className: string, gettextCatalog: GettextCatalog) {
  return filterForSearchResult(searchClassModal, className, classIdFromNamespaceId(namespaceId, className), gettextCatalog);
}

export function filterForNewClass(className: string, gettextCatalog: GettextCatalog) {
  return filterForAddNewResult(searchClassModal, className, gettextCatalog, 'class');
}

export function selectClass(namespaceId: string, className: string) {
  return selectSearchResult(searchClassModal, className, classIdFromNamespaceId(namespaceId, className), true);
}

export const selectAddNewClassSearchResult = selectAddNewResult(searchClassModal, 0, 'Select new creation');

export const focusSelectedClass = focusSearchSelection(searchClassModal, 'Class is here', 'Class is here info');

export const confirmClassSelection = (navigates: boolean) => confirm(searchClassModal, navigates);

export function findAndSelectExistingClassItems(namespaceId: string, className: string, navigates: boolean, gettextCatalog: GettextCatalog): Story[] {
  return [
    filterForClass(namespaceId, className, gettextCatalog),
    selectClass(namespaceId, className),
    focusSelectedClass,
    confirmClassSelection(navigates)
  ];
}

export function findAndCreateNewBasedOnConceptSuggestionItems(name: string, comment: string, gettextCatalog: GettextCatalog): Story[] {
  return [
    filterForNewClass(name, gettextCatalog),
    selectAddNewClassSearchResult,
    ...SearchConceptModal.findAndCreateNewSuggestionItems(name, comment, true, gettextCatalog)
  ];
}
