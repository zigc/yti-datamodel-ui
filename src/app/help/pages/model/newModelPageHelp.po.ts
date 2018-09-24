import { upperCaseFirst } from 'change-case';
import { child, editableByTitle, editableFocus, editableMultipleByTitle, input, multiInput } from 'app/help/selectors';
import {
  createClickNextCondition,
  createExpectedStateNextCondition,
  createExplicitNextCondition,
  createNavigatingClickNextCondition,
  createScrollNone,
  createStory,
  Story
} from 'app/help/contract';
import { editableMargin, initialInputValue, validInput } from 'app/help/utils';
import { KnownModelType } from 'app/types/entity';
import * as SearchClassificationModal from './modal/searchClassificationModalHelp.po';
import * as SearchOrganizationsModal from './modal/searchOrganizationModalHelp.po';
import { Localizable } from 'yti-common-ui/types/localization';
import { Language } from 'app/types/language';
import { Uri } from 'app/entities/uri';

const form = () => jQuery('form');

export function enterModelPrefix(prefix: string) {

  const enterModelPrefixElement = editableByTitle(form, 'Prefix');
  const enterModelPrefixInputElement = input(enterModelPrefixElement);

  return createStory({

    title: { key: 'Prefix' },
    content: { key: 'Prefix info' },
    popover: { element: enterModelPrefixInputElement, position: 'right-down' },
    focus: { element: editableFocus(enterModelPrefixElement), margin: editableMargin },
    nextCondition: createExpectedStateNextCondition(validInput(enterModelPrefixInputElement)),
    reversible: true,
    initialize: initialInputValue(enterModelPrefixInputElement, prefix)
  });
}

export function enterModelLabel(type: KnownModelType, label: string) {

  const title = upperCaseFirst(type) + ' label';
  const enterModelLabelElement = editableByTitle(form, title);
  const enterModelLabelInputElement = input(enterModelLabelElement);

  return createStory({

    title: { key: title },
    content: { key: title + ' info' },
    popover: { element: enterModelLabelInputElement, position: 'right-down' },
    focus: { element: editableFocus(enterModelLabelElement), margin: editableMargin },
    nextCondition: createExpectedStateNextCondition(validInput(enterModelLabelInputElement)),
    reversible: true,
    initialize: initialInputValue(enterModelLabelInputElement, label)
  });
}

export function enterModelComment(initialValue: string) {

  const title = 'Description';
  const enterModelCommentElement = editableByTitle(form, title);
  const enterModelCommentInputElement = input(enterModelCommentElement);

  return createStory({

    title: { key: title },
    content: { key: title + ' info' },
    popover: { element: enterModelCommentInputElement, position: 'right-down' },
    focus: { element: editableFocus(enterModelCommentElement), margin: editableMargin },
    nextCondition: createExpectedStateNextCondition(validInput(enterModelCommentInputElement)),
    reversible: true,
    initialize: initialInputValue(enterModelCommentInputElement, initialValue)
  });
}

const enterModelLanguageElement = editableMultipleByTitle(form, 'Model languages');
const enterModelLanguageInputElement = multiInput(enterModelLanguageElement);
export const enterModelLanguage = createStory({

  title: { key: 'Model languages' },
  content: { key: 'Model languages info' },
  popover: { element: enterModelLanguageInputElement, position: 'right-down' },
  focus: { element: editableFocus(enterModelLanguageElement), margin: editableMargin },
  reversible: true,
  nextCondition: createExpectedStateNextCondition(validInput(enterModelLanguageInputElement))
});

const addClassificationElement = () => jQuery('classifications-view button');
export const addClassification = createStory({

  title: { key: 'Add classification' },
  content: { key: 'Add classification info' },
  popover: { element: addClassificationElement, position: 'left-down' },
  focus: { element: addClassificationElement },
  reversible: true,
  nextCondition: createClickNextCondition(addClassificationElement)
});

const addContributorElement = () => jQuery('contributors-view button');
export const addContributor = createStory({

  title: { key: 'Add contributor' },
  content: { key: 'Add contributor info' },
  popover: { element: addContributorElement, position: 'left-down' },
  focus: { element: addContributorElement },
  reversible: true,
  nextCondition: createClickNextCondition(addContributorElement)
});

const focusClassificationsElement = () => jQuery('classifications-view editable-table');
export const focusClassifications = createStory({
  title: { key: 'Classifications are here' },
  scroll: createScrollNone(),
  popover: { element: focusClassificationsElement, position: 'left-down' },
  focus: { element: focusClassificationsElement },
  denyInteraction: true,
  nextCondition: createExplicitNextCondition()
});

const focusContributorsElement = () => jQuery('contributors-view editable-table');
export const focusContributors = createStory({
  title: { key: 'Contributors are here' },
  scroll: createScrollNone(),
  popover: { element: focusContributorsElement, position: 'left-down' },
  focus: { element: focusContributorsElement },
  denyInteraction: true,
  nextCondition: createExplicitNextCondition()
});

const saveUnsavedModelElement = child(form, 'button.save');
export const saveUnsavedModel = createStory({
  title: { key: 'Save changes' },
  content: { key: 'Changes need to be saved' },
  popover: { element: saveUnsavedModelElement, position: 'left-down' },
  focus: { element: saveUnsavedModelElement },
  nextCondition: createNavigatingClickNextCondition(saveUnsavedModelElement)
});

export interface CreateModelDetails {
  model: {
    type: KnownModelType;
    prefix: string;
    label: Localizable;
    comment: Localizable;
  };
  classification: {
    id: string;
    label: Localizable;
  },
  organization: {
    id: Uri;
    label: Localizable;
  }
}

export function createModelItems(details: CreateModelDetails, lang: Language): Story[] {

  return [
    enterModelLabel(details.model.type, details.model.label[lang]),
    enterModelComment(details.model.comment[lang]),
    enterModelLanguage,
    enterModelPrefix(details.model.prefix),
    addClassification,
    SearchClassificationModal.selectClassification(details.classification.label[lang], details.classification.id),
    focusClassifications,
    addContributor,
    SearchOrganizationsModal.selectOrganization(details.organization.label[lang], details.organization.id.uri),
    focusContributors,
    saveUnsavedModel
  ]
}
