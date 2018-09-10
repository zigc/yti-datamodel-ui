import { child, first } from 'app/help/selectors';
import {
  createStory, createModifyingClickNextCondition,
  createClickNextCondition, createScrollWithDefault, createScrollNone, Story
} from 'app/help/contract';
import * as ClassForm from './classFormHelp.po';
import * as SearchPredicateModal from './modal/searchPredicateModalHelp.po';
import { KnownPredicateType } from 'app/types/entity';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';

export const element = () => jQuery('class-view');

const modifyClassElement = child(element, 'button.edit');
export const modifyClass = createStory({

  title: 'Modify class',
  content: 'Classes can be modified',
  scroll: createScrollWithDefault(element),
  popover: { element: modifyClassElement, position: 'left-down' },
  focus: { element: modifyClassElement },
  nextCondition: createModifyingClickNextCondition(modifyClassElement)
});

const saveClassChangesElement = child(element, 'button.save');
export const saveClassChanges = createStory({

  title: 'Save changes',
  content: 'Changes need to be saved',
  scroll: createScrollWithDefault(element),
  popover: { element: saveClassChangesElement, position: 'left-down' },
  focus: { element: saveClassChangesElement },
  nextCondition: createModifyingClickNextCondition(saveClassChangesElement)
});

const addPropertyElement = child(element, '.add-property');
const addPropertyDropdownElement = child(addPropertyElement, 'button');
const addNewPropertyElement = first(child(addPropertyElement, '[uib-dropdown-menu] a'));
export const addProperty = createStory({
  title: 'Add property',
  content: 'You can add new attribute or association to the Class from here',
  scroll: createScrollNone(),
  popover: { element: addPropertyDropdownElement, position: 'top-left' },
  focus: { element: addPropertyDropdownElement },
  nextCondition: createClickNextCondition(addPropertyDropdownElement)
});

export const addNewProperty = createStory({
  title: 'Add new property',
  content: 'Add new property description',
  scroll: createScrollNone(),
  popover: { element: addNewPropertyElement, position: 'top-left' },
  focus: { element: addNewPropertyElement },
  nextCondition: createClickNextCondition(addNewPropertyElement)
});

export function addPropertyUsingExistingPredicateItems(predicate: { type: KnownPredicateType, namespaceId: string, name: string },
                                                       gettextCatalog: GettextCatalog): Story[] {
  return [
    addProperty,
    addNewProperty,
    ...SearchPredicateModal.findAndSelectExistingPredicateItems(predicate.type, predicate.namespaceId, predicate.name, gettextCatalog),
    ClassForm.focusOpenProperty(element)
  ];
}

export function addPropertyBasedOnSuggestionItems(predicate: { type: KnownPredicateType, searchName: string, name: string, comment: string },
                                                  gettextCatalog: GettextCatalog): Story[] {
  return [
    addProperty,
    addNewProperty,
    ...SearchPredicateModal.findAndCreateNewPropertyBasedOnSuggestionItems(predicate.type, predicate.searchName, predicate.name, predicate.comment, gettextCatalog),
    ClassForm.focusOpenProperty(element)
  ];
}

export function addPropertyBasedOnExistingConceptItems(predicate: { type: KnownPredicateType, searchName: string, name: string, conceptId: string },
                                                       gettextCatalog: GettextCatalog): Story[] {
  return [
    addProperty,
    addNewProperty,
    ...SearchPredicateModal.findAndCreateNewPropertyBasedOnExistingConceptItems(predicate.type, predicate.searchName, predicate.name, predicate.conceptId, gettextCatalog),
    ClassForm.focusOpenProperty(element)
  ];
}
