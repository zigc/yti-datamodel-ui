import { upperCaseFirst } from 'change-case';
import { child, editableByTitle, editableFocus, editableMultipleByTitle, input, multiInput } from 'app/help/selectors';
import { createStory, createNavigatingClickNextCondition, createExpectedStateNextCondition, createClickNextCondition } from 'app/help/contract';
import { editableMargin, initialInputValue, validInput } from 'app/help/utils';
import { KnownModelType } from 'app/types/entity';
import { createExplicitNextCondition, createScrollNone } from 'app/help/contract';
import GettextCatalog = angular.gettext.gettextCatalog;

const form = () => angular.element('form');

export function enterModelPrefix(prefix: string) {

  const enterModelPrefixElement = editableByTitle(form, 'Prefix');
  const enterModelPrefixInputElement = input(enterModelPrefixElement);

  return createStory({

    title: 'Prefix',
    content: 'Prefix info',
    popover: { element: enterModelPrefixInputElement, position: 'right-down' },
    focus: { element: editableFocus(enterModelPrefixElement), margin: editableMargin },
    nextCondition: createExpectedStateNextCondition(validInput(enterModelPrefixInputElement)),
    reversible: true,
    initialize: initialInputValue(enterModelPrefixInputElement, prefix)
  });
}

export function enterModelLabel(type: KnownModelType, label: string, gettextCatalog: GettextCatalog) {

  const title = upperCaseFirst(type) + ' label';
  const enterModelLabelElement = editableByTitle(form, title);
  const enterModelLabelInputElement = input(enterModelLabelElement);

  return createStory({

    title: title,
    content: title + ' info',
    popover: { element: enterModelLabelInputElement, position: 'right-down' },
    focus: { element: editableFocus(enterModelLabelElement), margin: editableMargin },
    nextCondition: createExpectedStateNextCondition(validInput(enterModelLabelInputElement)),
    reversible: true,
    initialize: initialInputValue(enterModelLabelInputElement, gettextCatalog.getString(label))
  });
}

export function enterModelComment(initialValue: string, gettextCatalog: GettextCatalog) {

  const title = 'Description';
  const enterModelCommentElement = editableByTitle(form, title);
  const enterModelCommentInputElement = input(enterModelCommentElement);

  return createStory({

    title: title,
    content: title + ' info',
    popover: { element: enterModelCommentInputElement, position: 'right-down' },
    focus: { element: editableFocus(enterModelCommentElement), margin: editableMargin },
    nextCondition: createExpectedStateNextCondition(validInput(enterModelCommentInputElement)),
    reversible: true,
    initialize: initialInputValue(enterModelCommentInputElement, gettextCatalog.getString(initialValue))
  });
}

const enterModelLanguageElement = editableMultipleByTitle(form, 'Model languages');
const enterModelLanguageInputElement = multiInput(enterModelLanguageElement);
export const enterModelLanguage = createStory({

  title: 'Model languages',
  content: 'Model languages info',
  popover: { element: enterModelLanguageInputElement, position: 'right-down' },
  focus: { element: editableFocus(enterModelLanguageElement), margin: editableMargin },
  reversible: true,
  nextCondition: createExpectedStateNextCondition(validInput(enterModelLanguageInputElement))
});

const addClassificationElement = () => angular.element('classifications-view button');
export const addClassification = createStory({

  title: 'Add classification',
  content: 'Add classification info',
  popover: { element: addClassificationElement, position: 'left-down' },
  focus: { element: addClassificationElement },
  reversible: true,
  nextCondition: createClickNextCondition(addClassificationElement)
});

const addContributorElement = () => angular.element('contributors-view button');
export const addContributor = createStory({

  title: 'Add contributor',
  content: 'Add contributor info',
  popover: { element: addContributorElement, position: 'left-down' },
  focus: { element: addContributorElement },
  reversible: true,
  nextCondition: createClickNextCondition(addContributorElement)
});

const focusClassificationsElement = () => angular.element('classifications-view editable-table');
export const focusClassifications = createStory({
  title: 'Classifications are here',
  scroll: createScrollNone(),
  popover: { element: focusClassificationsElement, position: 'left-down' },
  focus: { element: focusClassificationsElement },
  denyInteraction: true,
  nextCondition: createExplicitNextCondition()
});

const focusContributorsElement = () => angular.element('contributors-view editable-table');
export const focusContributors = createStory({
  title: 'Contributors are here',
  scroll: createScrollNone(),
  popover: { element: focusContributorsElement, position: 'left-down' },
  focus: { element: focusContributorsElement },
  denyInteraction: true,
  nextCondition: createExplicitNextCondition()
});

const saveUnsavedModelElement = child(form, 'button.save');
export const saveUnsavedModel = createStory({

  title: 'Save changes',
  content: 'Changes need to be saved',
  popover: { element: saveUnsavedModelElement, position: 'left-down' },
  focus: { element: saveUnsavedModelElement },
  nextCondition: createNavigatingClickNextCondition(saveUnsavedModelElement)
});
