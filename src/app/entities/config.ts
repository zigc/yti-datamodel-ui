import { Concept } from './vocabulary';

export class Config {

  constructor(public groupsManagementUrl: string,
              public terminologyUrl: string,
              public codeListUrl: string,
              public dev: boolean) {
  }

  conceptUrl(concept: Concept|null) {
    if (!concept) {
      return '';
    } else {
      return ''; // TODO
    }
  }

  get showIncompleteFeature() {
    return this.dev;
  }
}
