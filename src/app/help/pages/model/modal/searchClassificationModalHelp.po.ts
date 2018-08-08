import { Story } from '../../../contract';
import { selectSearchResult } from '../../modal/searchModalHelp.po';
import { modal } from '../../../selectors';

export function selectClassification(name: string, id: string): Story {
    return selectSearchResult(modal, name, id, true);
}
