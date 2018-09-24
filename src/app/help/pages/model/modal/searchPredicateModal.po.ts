import { child, modal } from 'app/help/utils/selector';
import { KnownPredicateType } from 'app/types/entity';
import * as Modal from 'app/help/pages/modal/modal.po';
import * as SearchModal from 'app/help/pages/modal/searchModal.po';
import * as SearchConceptModal from './searchConceptModal.po';
import * as PredicateForm from 'app/help/pages/model/predicateForm.po';
import { Story } from 'app/help/contract';

export const searchPredicateModalElement = child(modal, '.search-predicate');

export function filterForPredicate(predicateName: string, predicateId: string) {
  return SearchModal.filterForSearchResult(searchPredicateModalElement, predicateName, predicateId, true);
}

export function filterForNewPredicate(predicateName: string, abbreviate: boolean) {
  return SearchModal.filterForAddNewResult(searchPredicateModalElement, predicateName, 'predicate', abbreviate);
}

export function selectPredicate(predicateName: string, predicateId: string) {
  return SearchModal.selectSearchResult(searchPredicateModalElement, predicateName, predicateId, true);
}

export function selectAddNewPredicateSearchResult(type: KnownPredicateType) {
  return SearchModal.selectAddNewResult(searchPredicateModalElement, type === 'attribute' ? 0 : 1, `Select new ${type} creation`);
}

export const focusSelectedAttribute = SearchModal.focusSearchSelection(searchPredicateModalElement, 'Attribute is here', 'Attribute is here info');
export const focusSelectedAssociation = SearchModal.focusSearchSelection(searchPredicateModalElement, 'Association is here', 'Attribute is here info');

export function confirmPredicateSelection(navigates: boolean) {
  return Modal.confirm(searchPredicateModalElement, navigates);
}

export const UseCases = {

  findAndSelectExistingPredicate(type: KnownPredicateType,
                                 predicateName: string,
                                 predicateId: string): Story[] {
    return [
      filterForPredicate(predicateName, predicateId),
      selectPredicate(predicateName, predicateId),
      type === 'attribute' ? focusSelectedAttribute : focusSelectedAssociation,
      confirmPredicateSelection(true)
    ];
  },
  findAndCreateNewBasedOnSuggestion(type: KnownPredicateType,
                                    name: string,
                                    comment: string,
                                    navigates: boolean): Story[] {
    return [
      filterForNewPredicate(name, true),
      selectAddNewPredicateSearchResult(type),
      ...SearchConceptModal.UseCases.findAndCreateNewSuggestion(name, comment, navigates)
    ];
  },
  findAndCreateNewBasedOnExistingConcept(type: KnownPredicateType,
                                         name: string,
                                         conceptId: string,
                                         navigates: boolean): Story[] {
    return [
      filterForNewPredicate(name, true),
      selectAddNewPredicateSearchResult(type),
      ...SearchConceptModal.UseCases.findAndSelectExistingConcept(name, conceptId, navigates)
    ];
  },
  findAndCreateNewPropertyBasedOnSuggestion(type: KnownPredicateType,
                                            name: string,
                                            comment: string): Story[] {
    return [
      ...UseCases.findAndCreateNewBasedOnSuggestion(type, name, comment, false),
      type === 'attribute' ? focusSelectedAttribute : focusSelectedAssociation,
      PredicateForm.enterPredicateLabel(searchPredicateModalElement, type, name),
      confirmPredicateSelection(true)
    ];
  },
  findAndCreateNewPropertyBasedOnExistingConcept(type: KnownPredicateType,
                                                 name: string,
                                                 conceptId: string): Story[] {
    return [
      ...UseCases.findAndCreateNewBasedOnExistingConcept(type, name, conceptId, false),
      type === 'attribute' ? focusSelectedAttribute : focusSelectedAssociation,
      PredicateForm.enterPredicateLabel(searchPredicateModalElement, type, name),
      confirmPredicateSelection(true)
    ];
  }
};
