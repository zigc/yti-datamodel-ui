import { Role, UUID } from 'yti-common-ui/services/user.service';

export interface User {

  anonymous: boolean;
  name: string;

  getRoles(organizationIds: UUID|UUID[]): Set<Role>;
  getOrganizations(roles: Role|Role[]): Set<UUID>;
  isInRole(role: Role|Role[], organizationIds: UUID|UUID[]): boolean;
  isInOrganization(organizationIds: UUID|UUID[], roles: Role|Role[]): boolean;
}
