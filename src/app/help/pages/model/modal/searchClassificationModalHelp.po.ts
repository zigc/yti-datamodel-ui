import { Story } from 'app/help/contract';
import { selectSearchResult } from 'app/help/pages/modal/searchModalHelp.po';
import { modal } from 'app/help/selectors';

export function selectClassification(name: string, id: string): Story {
    return selectSearchResult(modal, name, id, true);
}
