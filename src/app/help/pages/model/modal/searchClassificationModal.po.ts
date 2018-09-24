import { Story } from 'app/help/contract';
import * as SearchModal from 'app/help/pages/modal/searchModal.po';
import { modal } from 'app/help/utils/selector';

export const UseCases = {

  selectClassification(name: string, id: string): Story[] {
    return [
      SearchModal.selectSearchResult(modal, name, id, true)
    ];
  }
};
