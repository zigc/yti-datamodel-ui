import { PredicateType, ClassType } from '../types/entity';
import { Language } from '../types/language';
import { Uri } from './uri';

export class ExternalEntity {

  id?: Uri;

  constructor(public language: Language, public label: string, public type: ClassType|PredicateType) {
  }

  get normalizedType() {
    return this.type;
  }
}
