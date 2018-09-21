import { filterForSearchResult, selectSearchResult } from 'app/help/pages/modal/searchModalHelp.po';
import { child, modal } from 'app/help/selectors';

const searchNamespaceModal = child(modal, '.search-namespace');

export function filterForModel(label: string, namespaceId: string) {
  return filterForSearchResult(searchNamespaceModal, label, namespaceId, true);
}

export function selectNamespace(label: string, namespaceId: string) {
  return selectSearchResult(searchNamespaceModal, label, namespaceId, false);
}
