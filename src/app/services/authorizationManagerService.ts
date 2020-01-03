import { UserService } from './userService';
import { Model } from 'app/entities/model';
import { User } from 'app/entities/user';
import { WithDefinedBy } from 'app/types/entity';
import { Association, Attribute } from 'app/entities/predicate';
import { Class } from 'app/entities/class';
import { Organization } from 'app/entities/organization';
import { selectableStatuses, Status } from 'yti-common-ui/entities/status';

function isReference(model: Model, resource: WithDefinedBy): boolean {
  return resource.definedBy.id.notEquals(model.id);
}

function isRemovableStatus(status: Status|null): boolean {
  return status === 'SUGGESTED' || status === 'DRAFT' || status === 'INCOMPLETE' || status === null;
}

export class AuthorizationManagerService {

  allowedTargetStatusesFrom_INCOMPLETE = ['INCOMPLETE', 'DRAFT'] as Status[];
  allowedTargetStatusesFrom_DRAFT = ['DRAFT', 'INCOMPLETE', 'VALID'] as Status[];
  allowedTargetStatusesFrom_VALID = ['VALID', 'RETIRED', 'INVALID'] as Status[];
  allowedTargetStatusesFrom_RETIRED = ['RETIRED', 'VALID', 'INVALID'] as Status[];
  allowedTargetStatusesFrom_INVALID = ['INVALID', 'VALID', 'RETIRED'] as Status[];

  constructor(private userService: UserService) {
    'ngInject';
  }

  private get user(): User {
    return this.userService.user;
  }

  get isSuperUser() {
    return this.user.superuser;
  }

  canEditModel(model: Model): boolean {
    return this.hasRightToModifyModel(model);
  }

  canRemoveModel(model: Model): boolean {
    return isRemovableStatus(model.status) && this.hasRightToModifyModel(model);
  }

  getAllowedStatuses(model: Model) {
    const originalStatus = model.status;

    if (this.isSuperUser) {
      return selectableStatuses;
    }

    if (originalStatus) {
      if (originalStatus === 'INCOMPLETE') {
        return this.allowedTargetStatusesFrom_INCOMPLETE;
      } else if (originalStatus === 'DRAFT') {
        return this.allowedTargetStatusesFrom_DRAFT;
      } else if (originalStatus === 'VALID') {
        return this.allowedTargetStatusesFrom_VALID;
      } else if (originalStatus === 'RETIRED') {
        return this.allowedTargetStatusesFrom_RETIRED;
      } else if (originalStatus === 'INVALID') {
        return this.allowedTargetStatusesFrom_INVALID;
      } else {
        return selectableStatuses; // should never come here anymore
      }
    } else {
      return selectableStatuses;
    }
  }

  filterOrganizationsAllowedForUser(organizations: Organization[]) {
    return organizations.filter(org =>
      this.user.superuser || this.user.isInRole(['ADMIN', 'DATA_MODEL_EDITOR'], org.id.uuid));
  }

  canEditPredicate(model: Model, predicate: Association | Attribute) {
    return !isReference(model, predicate) && this.hasRightToModifyModel(model);
  }

  canRemovePredicate(model: Model, predicate: Association | Attribute) {
    return (isReference(model, predicate) || isRemovableStatus(predicate.status)) && this.hasRightToModifyModel(model);
  }

  canEditClass(model: Model, klass: Class) {
    return !isReference(model, klass) && this.hasRightToModifyModel(model);
  }

  canRemoveClass(model: Model, klass: Class) {
    return (isReference(model, klass) || isRemovableStatus(klass.status)) && this.hasRightToModifyModel(model);
  }

  canSaveVisualization(model: Model) {
    return this.hasRightToModifyModel(model);
  }

  private hasRightToModifyModel(model: Model): boolean {

    if (this.user.superuser) {
      return true;
    }

    return this.user.isInRole(['ADMIN', 'DATA_MODEL_EDITOR'], model.contributors.map(org => org.id.uuid));
  }

  canAddModel() {
    return this.user.isInRoleInAnyOrganization(['ADMIN', 'DATA_MODEL_EDITOR']);
  }
}
