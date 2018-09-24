import { createClickNextCondition, createExplicitNextCondition, createScrollNone, createScrollWithDefault, createStory, Story } from 'app/help/contract';
import { child, editableByTitle, editableFocus } from 'app/help/selectors';
import { editableMargin } from 'app/help/utils';
import * as SearchClassModal from './modal/searchClassModal.po';
import * as AddPropertiesFromClassModal from './modal/addPropertiesFromClassModal.po';
import { ClassDetails } from 'app/services/entityLoader';
import { Language } from 'app/types/language';
import { classIdAndNameFromHelpData } from 'app/help/utils';

export function focusClass(parent: () => JQuery) {

  const focusClassElement = child(parent, 'form');

  return createStory({
    title: { key: 'Class is here' },
    content: { key: 'Class is here info' },
    popover: { element: focusClassElement, position: 'top-right' },
    focus: { element: focusClassElement },
    denyInteraction: true,
    nextCondition: createExplicitNextCondition()
  });
}

export function focusOpenProperty(parent: () => JQuery) {

  const focusOpenPropertyElement = child(parent, 'property-view div[ng-if="$ctrl.isOpen()"]');

  return createStory({
    title: { key: 'Property is here' },
    content: { key: 'Property is here info' },
    scroll: createScrollNone(),
    popover: { element: focusOpenPropertyElement, position: 'right-down' },
    focus: { element: focusOpenPropertyElement, margin: { left: 10, right: 10, top: 0, bottom: 10 } },
    denyInteraction: true,
    nextCondition: createExplicitNextCondition()
  });
}

export function selectAssociationTarget(parent: () => JQuery) {

  const enterAssociationTargetElement = editableByTitle(parent, 'Value class');
  const enterAssociationTargetSelectButtonElement = child(enterAssociationTargetElement, 'button');

  return createStory({

    title: { key: 'Select association target' },
    content: { key: 'Association target must be selected from list of existing classes' },
    scroll: createScrollNone(),
    popover: { element: enterAssociationTargetSelectButtonElement, position: 'right-down' },
    focus: { element: enterAssociationTargetSelectButtonElement },
    nextCondition: createClickNextCondition(enterAssociationTargetSelectButtonElement)
  });
}

export function selectSuperClass(parent: () => JQuery) {

  const enterSuperClassElement = editableByTitle(parent, 'Superclass');
  const enterSuperClassSelectButtonElement = child(enterSuperClassElement, 'button');

  return createStory({

    title: { key: 'Select super class' },
    content: { key: 'Super class must be selected from list of existing classes' },
    scroll: createScrollNone(),
    popover: { element: enterSuperClassSelectButtonElement, position: 'right-down' },
    focus: { element: enterSuperClassSelectButtonElement },
    nextCondition: createClickNextCondition(enterSuperClassSelectButtonElement)
  });
}

export function focusAssociationTarget(parent: () => JQuery) {

  const enterAssociationTargetElement = editableByTitle(parent, 'Value class');
  const enterAssociationTargetSelectFocusElement = editableFocus(enterAssociationTargetElement);

  return createStory({

    title: { key: 'Association target is here' },
    content: { key: 'Association target can be changed from the list or by typing the identifier' },
    scroll: createScrollWithDefault(enterAssociationTargetElement, 150),
    popover: { element: enterAssociationTargetSelectFocusElement, position: 'right-down' },
    focus: { element: enterAssociationTargetSelectFocusElement, margin: editableMargin },
    denyInteraction: true,
    nextCondition: createExplicitNextCondition()
  });
}

export function focusSuperClass(parent: () => JQuery) {

  const enterSuperClassElement = editableByTitle(parent, 'Superclass');
  const enterSuperClassSelectFocusElement = editableFocus(enterSuperClassElement);

  return createStory({

    title: { key: 'Super class is here' },
    content: { key: 'Super class can be changed from the list or by typing the identifier' },
    scroll: createScrollWithDefault(enterSuperClassElement, 150),
    popover: { element: enterSuperClassSelectFocusElement, position: 'right-down' },
    focus: { element: enterSuperClassSelectFocusElement, margin: editableMargin },
    denyInteraction: true,
    nextCondition: createExplicitNextCondition()
  });
}

export function addAssociationTargetItems(context: () => JQuery, target: { prefix: string, details: ClassDetails }, lang: Language): Story[] {

  const { id, name } = classIdAndNameFromHelpData(target, lang);

  return [
    selectAssociationTarget(context),
    ...SearchClassModal.findAndSelectExistingClassItems(name, id, false),
    focusAssociationTarget(context)
  ];
}

export function addSuperClassItems(context: () => JQuery, superClass: { prefix: string, details: ClassDetails, properties: string[] }, lang: Language): Story[] {

  const { id, name } = classIdAndNameFromHelpData(superClass, lang);

  return [
    selectSuperClass(context),
    ...SearchClassModal.findAndSelectExistingClassItems(name, id, false),
    ...AddPropertiesFromClassModal.selectAndConfirmPropertiesItems('Select registration number and vehicle code', false, superClass.properties),
    focusSuperClass(context)
  ];
}
