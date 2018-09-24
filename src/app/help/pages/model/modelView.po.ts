import { createClickNextCondition, createExplicitNextCondition, createModifyingClickNextCondition, createScrollNone, createStory, Story } from 'app/help/contract';
import { child } from 'app/help/selectors';
import { KnownModelType } from 'app/types/entity';
import * as SearchNamespaceModal from './modal/searchNamepaceModal.po';
import * as SearchVocabularyModal from './modal/searchVocabularyModal.po';
import { Localizable } from 'yti-common-ui/types/localization';
import { Language } from 'app/types/language';
import { modelIdFromPrefix, vocabularyIdFromPrefix } from 'app/help/utils';

export const element = () => jQuery('model-view');

export function modifyModel(type: KnownModelType) {

  const modifyModelElement = child(element, 'button.edit');
  return createStory({

    title: { key: 'Modify ' + type },
    content: { key: 'Modify ' + type + ' description' },
    popover: { element: modifyModelElement, position: 'left-down' },
    focus: { element: modifyModelElement },
    nextCondition: createModifyingClickNextCondition(modifyModelElement)
  });
}

const requireNamespaceElement = child(element, 'imported-namespaces-view button');
export const requireNamespace = createStory({

  title: { key: 'Add reference to namespace' },
  content: { key: 'Add reference to namespace description' },
  popover: { element: requireNamespaceElement, position: 'left-down' },
  focus: { element: requireNamespaceElement },
  nextCondition: createClickNextCondition(requireNamespaceElement)
});


const addVocabularyElement = child(element, 'vocabularies-view button');
export const addVocabulary = createStory({

  title: { key: 'Add vocabulary' },
  content: { key: 'Add vocabulary description' },
  popover: { element: addVocabularyElement, position: 'left-down' },
  focus: { element: addVocabularyElement },
  nextCondition: createClickNextCondition(addVocabularyElement)
});

const saveModelChangesElement = child(element, 'button.save');
export const saveModelChanges = createStory({

  title: { key: 'Save changes' },
  content: { key: 'Changes need to be saved' },
  popover: { element: saveModelChangesElement, position: 'left-down' },
  focus: { element: saveModelChangesElement },
  nextCondition: createModifyingClickNextCondition(saveModelChangesElement)
});

const focusNamespacesElement = child(element, 'imported-namespaces-view editable-table');
export const focusNamespaces = createStory({
  title: { key: 'Imported namespaces are here' },
  content: { key: 'Imported namespaces can be used to link resources to existing standards' },
  scroll: createScrollNone(),
  popover: { element: focusNamespacesElement, position: 'left-down' },
  focus: { element: focusNamespacesElement },
  denyInteraction: true,
  nextCondition: createExplicitNextCondition()
});

const focusVocabulariesElement = child(element, 'vocabularies-view editable-table');
export const focusVocabularies = createStory({
  title: { key: 'Vocabularies are here' },
  content: { key: 'Vocabularies can be used to link resources to existing concepts' },
  scroll: createScrollNone(),
  popover: { element: focusVocabulariesElement, position: 'left-down' },
  focus: { element: focusVocabulariesElement },
  denyInteraction: true,
  nextCondition: createExplicitNextCondition()
});

export function addModelNamespaceItems(model: { prefix: string }): Story[] {
  return [
    requireNamespace,
    SearchNamespaceModal.filterForModel(model.prefix, modelIdFromPrefix(model.prefix)),
    SearchNamespaceModal.selectNamespace(model.prefix, modelIdFromPrefix(model.prefix)),
    focusNamespaces
  ];
}

export function addVocabularyItems(vocabulary: { label: Localizable, prefix: string }, lang: Language): Story[] {

  const label = vocabulary.label[lang];
  const vocabularyId = vocabularyIdFromPrefix(vocabulary.prefix);

  return [
    addVocabulary,
    SearchVocabularyModal.filterForVocabulary(label, vocabularyId),
    SearchVocabularyModal.selectVocabulary(label, vocabularyId),
    focusVocabularies
  ];
}
