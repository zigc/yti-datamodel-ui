import * as SearchModal from 'app/help/pages/modal/searchModal.po';
import { child, modal } from 'app/help/utils/selector';
import { Story } from 'app/help/contract';

const searchNamespaceModal = child(modal, '.search-namespace');

export function filterForModel(label: string, namespaceId: string) {
  return SearchModal.filterForSearchResult(searchNamespaceModal, label, namespaceId, true);
}

export function selectNamespace(label: string, namespaceId: string) {
  return SearchModal.selectSearchResult(searchNamespaceModal, label, namespaceId, false);
}

export const UseCases = {

  filterAndSelect(label: string, namespaceId: string): Story[] {
    return [
      filterForModel(label, namespaceId),
      selectNamespace(label, namespaceId)
    ]
  }
};
