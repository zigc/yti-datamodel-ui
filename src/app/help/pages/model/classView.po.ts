import { child, first } from 'app/help/utils/selector';
import { createClickNextCondition, createModifyingClickNextCondition, createScrollNone, createScrollWithDefault, createStory, Story } from 'app/help/contract';
import { KnownPredicateType } from 'app/types/entity';
import { PredicateDetails } from 'app/services/entityLoader';
import { Language } from 'app/types/language';
import { predicateIdAndNameFromHelpData } from 'app/help/utils/id';
import { Localizable } from 'yti-common-ui/types/localization';
import { ClassDetails } from 'app/services/entityLoader';
import { classIdAndNameFromHelpData } from 'app/help/utils/id';
import * as SearchClassModal from './modal/searchClassModal.po';
import * as AddPropertiesFromClassModal from './modal/addPropertiesFromClassModal.po';
import * as ClassForm from './classForm.po';
import * as SearchPredicateModal from './modal/searchPredicateModal.po';

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

export const UseCases = {

  addPropertyUsingExistingPredicate(predicate: { type: KnownPredicateType, prefix: string, details: PredicateDetails }, lang: Language): Story[] {

    const { id, name } = predicateIdAndNameFromHelpData(predicate, lang);

    return [
      addProperty,
      addNewProperty,
      ...SearchPredicateModal.UseCases.findAndSelectExistingPredicate(predicate.type, name, id),
      ClassForm.focusOpenProperty(element)
    ];
  },
  addPropertyBasedOnSuggestion(predicate: { type: KnownPredicateType, label: Localizable, comment: Localizable }, lang: Language): Story[] {
    return [
      addProperty,
      addNewProperty,
      ...SearchPredicateModal.UseCases.findAndCreateNewPropertyBasedOnSuggestion(predicate.type, predicate.label[lang], predicate.comment[lang]),
      ClassForm.focusOpenProperty(element)
    ];
  },
  addPropertyBasedOnExistingConcept(predicate: { type: KnownPredicateType, name: Localizable, conceptId: string }, lang: Language): Story[] {
    return [
      addProperty,
      addNewProperty,
      ...SearchPredicateModal.UseCases.findAndCreateNewPropertyBasedOnExistingConcept(predicate.type, predicate.name[lang], predicate.conceptId),
      ClassForm.focusOpenProperty(element)
    ];
  },
  addAssociationTarget(target: { prefix: string, details: ClassDetails }, lang: Language): Story[] {

    const { id, name } = classIdAndNameFromHelpData(target, lang);

    return [
      ClassForm.selectAssociationTarget(element),
      ...SearchClassModal.UseCases.findAndSelectExistingClass(name, id, false),
      ClassForm.focusAssociationTarget(element)
    ];
  },
  addSuperClass(superClass: { prefix: string, details: ClassDetails, properties: string[] }, lang: Language): Story[] {

    const { id, name } = classIdAndNameFromHelpData(superClass, lang);

    return [
      ClassForm.selectSuperClass(element),
      ...SearchClassModal.UseCases.findAndSelectExistingClass(name, id, false),
      ...AddPropertiesFromClassModal.UseCases.selectAndConfirmProperties('Select registration number and vehicle code', false, superClass.properties),
      ClassForm.focusSuperClass(element)
    ];
  }
};
