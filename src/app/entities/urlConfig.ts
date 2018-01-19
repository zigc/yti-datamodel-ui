import { Concept } from './vocabulary';

export class UrlConfig {

  constructor(public groupsManagementUrl: string,
              public terminologyEditorUrl: string) {
  }

  conceptUrl(concept: Concept|null) {
    if (!concept) {
      return '';
    } else {
      return ''; // TODO
    }
  }
}
