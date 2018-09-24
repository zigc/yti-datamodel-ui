import { child, editableByTitle, editableFocus, input, modal, editableMargin } from 'app/help/utils/selector';
import { createExpectedStateNextCondition, createStory, Story } from 'app/help/contract';
import { validInput } from 'app/help/utils/condition';
import { initialInputValue } from 'app/help/utils/init';
import * as Modal from 'app/help/pages/modal/modal.po';
import * as SearchModal from 'app/help/pages/modal/searchModal.po';

const searchConceptModal = child(modal, '.search-concept');

export function filterForConceptSuggestionConcept(conceptName: string) {
  return SearchModal.filterForAddNewResult(searchConceptModal, conceptName, 'concept', false);
}

export function filterForConcept(className: string, conceptId: string) {
  return SearchModal.filterForSearchResult(searchConceptModal, className, conceptId, false);
}

export const addConceptSuggestionSearchResult = SearchModal.selectAddNewResult(searchConceptModal, 0, 'Select concept suggest creation');

export function selectConcept(conceptId: string, conceptName: string) {
  return SearchModal.selectSearchResult(searchConceptModal, conceptName, conceptId, true);
}

export const focusSelectedConcept = SearchModal.focusSearchSelection(searchConceptModal, 'Concept is here', 'Concept is here info');

const enterVocabularyElement = editableByTitle(modal, 'Vocabulary');
const enterVocabularyInputElement = input(enterVocabularyElement);
export const enterVocabulary = createStory({

  title: { key: 'Vocabulary' },
  content: { key: 'Select the vocabulary that is missing the required concept' },
  popover: { element: enterVocabularyInputElement, position: 'left-down' },
  focus: { element: editableFocus(enterVocabularyElement), margin: editableMargin },
  nextCondition: createExpectedStateNextCondition(validInput(enterVocabularyInputElement)),
  reversible: true
});

const enterLabelElement = editableByTitle(modal, 'Concept label');
const enterLabelInputElement = input(enterLabelElement);
export const enterLabel = createStory({

  title: { key: 'Concept label' },
  content: { key: 'Concept label info' },
  popover: { element: enterLabelInputElement, position: 'left-down' },
  focus: { element: editableFocus(enterLabelElement), margin: editableMargin },
  nextCondition: createExpectedStateNextCondition(validInput(enterLabelInputElement)),
  reversible: true
});

export function enterDefinition(initialValue: string) {

  const enterDefinitionElement = editableByTitle(modal, 'Definition');
  const enterDefinitionInputElement = input(enterDefinitionElement);

  return createStory({

    title: { key: 'Definition' },
    content: { key: 'Suggest definition or description for the concept' },
    popover: { element: enterDefinitionInputElement, position: 'left-down' },
    focus: { element: editableFocus(enterDefinitionElement), margin: editableMargin },
    nextCondition: createExpectedStateNextCondition(validInput(enterDefinitionInputElement)),
    initialize: initialInputValue(enterDefinitionInputElement, initialValue),
    reversible: true
  });
}

export function confirmConceptSelection(navigates: boolean) {
  return Modal.confirm(searchConceptModal, navigates);
}

export const UseCases = {

  findAndCreateNewSuggestion(name: string, definition: string, navigates: boolean): Story[] {
    return [
      filterForConceptSuggestionConcept(name),
      addConceptSuggestionSearchResult,
      enterVocabulary,
      enterLabel,
      enterDefinition(definition),
      confirmConceptSelection(navigates)
    ];
  },
  findAndSelectExistingConcept(name: string, conceptId: string, navigates: boolean): Story[] {
    return [
      filterForConcept(name, conceptId),
      selectConcept(conceptId, name),
      focusSelectedConcept,
      confirmConceptSelection(navigates)
    ];
  }
};
