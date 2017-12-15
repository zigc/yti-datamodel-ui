import { PredicateType, ClassType } from 'app/types/entity';
import { Language } from 'app/types/language';
import { Uri } from './uri';

export class ExternalEntity {

  id?: Uri;

  constructor(public language: Language, public label: string, public type: ClassType|PredicateType) {
  }

  get normalizedType() {
    return this.type;
  }
}
