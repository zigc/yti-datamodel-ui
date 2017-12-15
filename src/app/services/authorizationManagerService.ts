import { UserService } from './userService';
import { Model } from '../entities/model';
import { User } from '../entities/user';
import { State, WithDefinedBy } from '../types/entity';
import { Association, Attribute } from '../entities/predicate';
import { Class } from '../entities/class';

const userStates: State[] = ['Unstable', 'Draft'];
const adminStates: State[] = userStates.concat(['Recommendation', 'Deprecated']);

function isReference(model: Model, resource: WithDefinedBy): boolean {
  return resource.definedBy.id.notEquals(model.id);
}

export class AuthorizationManagerService {

  /* @ngInject */
  constructor(private userService: UserService) {
  }

  private get user(): User {
    return this.userService.user;
  }

  canEditModel(model: Model): boolean {
    return !this.user.anonymous; // TODO
  }

  canRemoveModel(model: Model): boolean {
    return model.state === 'Unstable' && !this.user.anonymous; // TODO
  }

  getAllowedStates(model: Model) {
    return adminStates; // TODO
    // return isAdminOf(model) ? adminStates : userStates;
  }

  canEditPredicate(model: Model, predicate: Association | Attribute) {
    return !isReference(model, predicate) && !this.user.anonymous; // TODO
  }

  canRemovePredicate(model: Model, predicate: Association | Attribute) {
    return (isReference(model, predicate) || predicate.state === 'Unstable') && !this.user.anonymous; // TODO
  }

  canEditClass(model: Model, klass: Class) {
    return !isReference(model, klass) && !this.user.anonymous; // TODO
  }

  canRemoveClass(model: Model, klass: Class) {
    return (isReference(model, klass) || klass.state === 'Unstable') && !this.user.anonymous; // TODO
  }

  canSaveVisualization(model: Model) {
    return !this.user.anonymous; // TODO
  }
}
