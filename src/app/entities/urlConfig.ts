import { Vocabulary } from './vocabulary';

export class UrlConfig {

  constructor(public groupsManagementUrl: string,
              public terminologyEditorUrl: string) {
  }

  vocabularyUrl(vocabulary: Vocabulary) {
    return this.terminologyEditorUrl + '/concepts/' + vocabulary.graph;
  }
}
