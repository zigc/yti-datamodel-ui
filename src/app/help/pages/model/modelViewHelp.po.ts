import {
  createClickNextCondition, createStory, createModifyingClickNextCondition,
  createExplicitNextCondition, createScrollNone, Story
} from 'app/help/contract';
import { child } from 'app/help/selectors';
import { KnownModelType } from 'app/types/entity';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import * as SearchNamespaceModal from './modal/searchNamepaceModalHelp.po';
import * as SearchVocabularyModal from './modal/searchVocabularyModalHelp.po';

export const element = () => jQuery('model-view');

export function modifyModel(type: KnownModelType) {

  const modifyModelElement = child(element, 'button.edit');
  return createStory({

    title: 'Modify ' + type,
    content: 'Modify ' + type + ' description',
    popover: { element: modifyModelElement, position: 'left-down' },
    focus: { element: modifyModelElement },
    nextCondition: createModifyingClickNextCondition(modifyModelElement)
  });
}

const requireNamespaceElement = child(element, 'imported-namespaces-view button');
export const requireNamespace = createStory({

  title: 'Add reference to namespace',
  content: 'Add reference to namespace description',
  popover: { element: requireNamespaceElement, position: 'left-down' },
  focus: { element: requireNamespaceElement },
  nextCondition: createClickNextCondition(requireNamespaceElement)
});


const addVocabularyElement = child(element, 'vocabularies-view button');
export const addVocabulary = createStory({

  title: 'Add vocabulary',
  content: 'Add vocabulary description',
  popover: { element: addVocabularyElement, position: 'left-down' },
  focus: { element: addVocabularyElement },
  nextCondition: createClickNextCondition(addVocabularyElement)
});

const saveModelChangesElement = child(element, 'button.save');
export const saveModelChanges = createStory({

  title: 'Save changes',
  content: 'Changes need to be saved',
  popover: { element: saveModelChangesElement, position: 'left-down' },
  focus: { element: saveModelChangesElement },
  nextCondition: createModifyingClickNextCondition(saveModelChangesElement)
});

const focusNamespacesElement = child(element, 'imported-namespaces-view editable-table');
export const focusNamespaces = createStory({
  title: 'Imported namespaces are here',
  scroll: createScrollNone(),
  content: 'Imported namespaces can be used to link resources to existing standards',
  popover: { element: focusNamespacesElement, position: 'left-down' },
  focus: { element: focusNamespacesElement },
  denyInteraction: true,
  nextCondition: createExplicitNextCondition()
});

const focusVocabulariesElement = child(element, 'vocabularies-view editable-table');
export const focusVocabularies = createStory({
  title: 'Vocabularies are here',
  scroll: createScrollNone(),
  content: 'Vocabularies can be used to link resources to existing concepts',
  popover: { element: focusVocabulariesElement, position: 'left-down' },
  focus: { element: focusVocabulariesElement },
  denyInteraction: true,
  nextCondition: createExplicitNextCondition()
});

export function addNamespaceItems(ns: { prefix: string, namespaceId: string }, gettextCatalog: GettextCatalog): Story[] {
  return [
    requireNamespace,
    SearchNamespaceModal.filterForModel(ns.prefix, ns.namespaceId, gettextCatalog),
    SearchNamespaceModal.selectNamespace(ns.prefix, ns.namespaceId),
    focusNamespaces
  ];
}

export function addVocabularyItems(vocabulary: { name: string, id: string }, gettextCatalog: GettextCatalog): Story[] {
  return [
    addVocabulary,
    SearchVocabularyModal.filterForVocabulary(vocabulary.name, vocabulary.id, gettextCatalog),
    SearchVocabularyModal.selectVocabualry(vocabulary.name, vocabulary.id),
    focusVocabularies
  ];
}
