import { filterForSearchResult, selectSearchResult } from 'app/help/pages/modal/searchModalHelp.po';
import { modal, child } from 'app/help/selectors';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';

const searchNamespaceModal = child(modal, '.search-namespace');

export function filterForModel(label: string, namespaceId: string, gettextCatalog: GettextCatalog) {
  return filterForSearchResult(searchNamespaceModal, label, namespaceId, gettextCatalog);
}

export function selectNamespace(label: string, namespaceId: string) {
  return selectSearchResult(searchNamespaceModal, label, namespaceId, false);
}
