import { UserService } from './userService';
import { Model } from 'app/entities/model';
import { User } from 'app/entities/user';
import { State, WithDefinedBy } from 'app/types/entity';
import { Association, Attribute } from 'app/entities/predicate';
import { Class } from 'app/entities/class';
import { Organization } from '../entities/organization';

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

  filterOrganizationsAllowedForUser(organizations: Organization[]) {
    return organizations.filter(org =>
      this.user.superuser || this.user.isInRole(['ADMIN', 'DATA_MODEL_EDITOR'], org.id.uuid));
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

  canAddModel() {
    return !this.user.anonymous; // TODO
  }
}
