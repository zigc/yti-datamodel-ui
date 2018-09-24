import { Story } from 'app/help/contract';
import { selectSearchResult } from 'app/help/pages/modal/searchModal.po';
import { modal } from 'app/help/utils/selector';

export function selectClassification(name: string, id: string): Story {
  return selectSearchResult(modal, name, id, true);
}
