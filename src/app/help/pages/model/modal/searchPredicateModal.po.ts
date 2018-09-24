import { confirm } from 'app/help/pages/modal/modal.po';
import { filterForAddNewResult, filterForSearchResult, focusSearchSelection, selectAddNewResult, selectSearchResult } from 'app/help/pages/modal/searchModal.po';
import { child, modal } from 'app/help/utils/selector';
import { KnownPredicateType } from 'app/types/entity';
import * as SearchConceptModal from './searchConceptModal.po';
import * as PredicateForm from 'app/help/pages/model/predicateForm.po';
import { Story } from 'app/help/contract';

export const searchPredicateModalElement = child(modal, '.search-predicate');

export function filterForPredicate(predicateName: string, predicateId: string) {
  return filterForSearchResult(searchPredicateModalElement, predicateName, predicateId, true);
}

export function filterForNewPredicate(predicateName: string, abbreviate: boolean) {
  return filterForAddNewResult(searchPredicateModalElement, predicateName, 'predicate', abbreviate);
}

export function selectPredicate(predicateName: string, predicateId: string) {
  return selectSearchResult(searchPredicateModalElement, predicateName, predicateId, true);
}

export function selectAddNewPredicateSearchResult(type: KnownPredicateType) {
  return selectAddNewResult(searchPredicateModalElement, type === 'attribute' ? 0 : 1, `Select new ${type} creation`);
}

export const focusSelectedAttribute = focusSearchSelection(searchPredicateModalElement, 'Attribute is here', 'Attribute is here info');
export const focusSelectedAssociation = focusSearchSelection(searchPredicateModalElement, 'Association is here', 'Attribute is here info');

export function confirmPredicateSelection(navigates: boolean) {
 return confirm(searchPredicateModalElement, navigates);
}

export function findAndSelectExistingPredicateItems(type: KnownPredicateType,
                                                    predicateName: string,
                                                    predicateId: string): Story[] {
  return [
    filterForPredicate(predicateName, predicateId),
    selectPredicate(predicateName, predicateId),
    type === 'attribute' ? focusSelectedAttribute : focusSelectedAssociation,
    confirmPredicateSelection(true)
  ];
}

export function findAndCreateNewBasedOnSuggestionItems(type: KnownPredicateType,
                                                       name: string,
                                                       comment: string,
                                                       navigates: boolean): Story[] {
  return [
    filterForNewPredicate(name, true),
    selectAddNewPredicateSearchResult(type),
    ...SearchConceptModal.findAndCreateNewSuggestionItems(name, comment, navigates)
  ];
}

export function findAndCreateNewBasedOnExistingConceptItems(type: KnownPredicateType,
                                                            name: string,
                                                            conceptId: string,
                                                            navigates: boolean): Story[] {
  return [
    filterForNewPredicate(name, true),
    selectAddNewPredicateSearchResult(type),
    ...SearchConceptModal.findAndSelectExistingConceptItems(name, conceptId, navigates)
  ];
}

export function findAndCreateNewPropertyBasedOnSuggestionItems(type: KnownPredicateType,
                                                               name: string,
                                                               comment: string): Story[] {
  return [
    ...findAndCreateNewBasedOnSuggestionItems(type, name, comment, false),
    type === 'attribute' ? focusSelectedAttribute : focusSelectedAssociation,
    PredicateForm.enterPredicateLabel(searchPredicateModalElement, type, name),
    confirmPredicateSelection(true)
  ];
}

export function findAndCreateNewPropertyBasedOnExistingConceptItems(type: KnownPredicateType,
                                                                    name: string,
                                                                    conceptId: string): Story[] {
  return [
    ...findAndCreateNewBasedOnExistingConceptItems(type, name, conceptId, false),
    type === 'attribute' ? focusSelectedAttribute : focusSelectedAssociation,
    PredicateForm.enterPredicateLabel(searchPredicateModalElement, type, name),
    confirmPredicateSelection(true)
  ];
}
