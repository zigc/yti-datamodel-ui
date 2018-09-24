import { child, first } from 'app/help/selectors';
import { createClickNextCondition, createModifyingClickNextCondition, createScrollNone, createScrollWithDefault, createStory, Story } from 'app/help/contract';
import * as ClassForm from './classForm.po';
import * as SearchPredicateModal from './modal/searchPredicateModal.po';
import { KnownPredicateType } from 'app/types/entity';
import { PredicateDetails } from 'app/services/entityLoader';
import { Language } from 'app/types/language';
import { predicateIdAndNameFromHelpData } from 'app/help/utils';
import { Localizable } from 'yti-common-ui/types/localization';

export const element = () => jQuery('class-view');

const modifyClassElement = child(element, 'button.edit');
export const modifyClass = createStory({

  title: { key: 'Modify class' },
  content: { key: 'Classes can be modified' },
  scroll: createScrollWithDefault(element),
  popover: { element: modifyClassElement, position: 'left-down' },
  focus: { element: modifyClassElement },
  nextCondition: createModifyingClickNextCondition(modifyClassElement)
});

const saveClassChangesElement = child(element, 'button.save');
export const saveClassChanges = createStory({

  title: { key: 'Save changes' },
  content: { key: 'Changes need to be saved' },
  scroll: createScrollWithDefault(element),
  popover: { element: saveClassChangesElement, position: 'left-down' },
  focus: { element: saveClassChangesElement },
  nextCondition: createModifyingClickNextCondition(saveClassChangesElement)
});

const addPropertyElement = child(element, '.add-property');
const addPropertyDropdownElement = child(addPropertyElement, 'button');
const addNewPropertyElement = first(child(addPropertyElement, '[uib-dropdown-menu] a'));
export const addProperty = createStory({
  title: { key: 'Add property' },
  content: { key: 'You can add new attribute or association to the Class from here' },
  popover: { element: addPropertyDropdownElement, position: 'top-left' },
  focus: { element: addPropertyDropdownElement },
  nextCondition: createClickNextCondition(addPropertyDropdownElement)
});

export const addNewProperty = createStory({
  title: { key: 'Add new property' },
  content: { key: 'Add new property description' },
  scroll: createScrollNone(),
  popover: { element: addNewPropertyElement, position: 'top-left' },
  focus: { element: addNewPropertyElement },
  nextCondition: createClickNextCondition(addNewPropertyElement)
});

export function addPropertyUsingExistingPredicateItems(predicate: { type: KnownPredicateType, prefix: string, details: PredicateDetails }, lang: Language): Story[] {

  const { id, name } = predicateIdAndNameFromHelpData(predicate, lang);

  return [
    addProperty,
    addNewProperty,
    ...SearchPredicateModal.findAndSelectExistingPredicateItems(predicate.type, name, id),
    ClassForm.focusOpenProperty(element)
  ];
}

export function addPropertyBasedOnSuggestionItems(predicate: { type: KnownPredicateType, label: Localizable, comment: Localizable }, lang: Language): Story[] {
  return [
    addProperty,
    addNewProperty,
    ...SearchPredicateModal.findAndCreateNewPropertyBasedOnSuggestionItems(predicate.type, predicate.label[lang], predicate.comment[lang]),
    ClassForm.focusOpenProperty(element)
  ];
}

export function addPropertyBasedOnExistingConceptItems(predicate: { type: KnownPredicateType, name: Localizable, conceptId: string }, lang: Language): Story[] {
  return [
    addProperty,
    addNewProperty,
    ...SearchPredicateModal.findAndCreateNewPropertyBasedOnExistingConceptItems(predicate.type, predicate.name[lang], predicate.conceptId),
    ClassForm.focusOpenProperty(element)
  ];
}
