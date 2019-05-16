import { Concept } from './vocabulary';

export class Config {

  constructor(public groupManagementUrl: string,
              public terminologyUrl: string,
              public codeListUrl: string,
              public dev: boolean,
              public env: string) {
  }

  get showIncompleteFeature() {
    return this.dev;
  }

  conceptUrl(concept: Concept | null) {
    if (!concept) {
      return '';
    } else {
      return ''; // TODO
    }
  }

  getEnvironmentIdentifier(style?: 'prefix' | 'postfix'): string {
    if (this.env !== 'prod') {
      const identifier = this.env.toUpperCase();
      if (!style) {
        return identifier;
      } else if (style === 'prefix') {
        return identifier + ' - ';
      } else if (style === 'postfix') {
        return ' - ' + identifier;
      }
    }
    return '';
  }
}
