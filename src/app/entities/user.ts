import { Role, UUID } from 'yti-common-ui/services/user.service';

export interface User {

  anonymous: boolean;
  name: string;
  superuser: boolean;

  isInRole(role: Role|Role[], organizationIds: UUID|UUID[]): boolean;
  isInOrganization(organizationIds: UUID|UUID[], roles: Role|Role[]): boolean;
  isInRoleInAnyOrganization(role: Role|Role[]): boolean;
}
