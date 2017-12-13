import { AbstractGroup } from './group';
import { Uri } from './uri';
import { AbstractModel } from './model';
import { normalizeAsArray } from '../utils/array';

export type Role = 'ADMIN'
                 | 'DATA_MODEL_EDITOR'
                 | 'TERMINOLOGY_EDITOR'
                 | 'CODE_LIST_EDITOR';

export type UUID = string;

export interface User {
  name: string|null;
  isLoggedIn(): boolean;
  isMemberOf(entity: AbstractModel|AbstractGroup): boolean;
  isMemberOfGroup(id: Uri): boolean;
  isAdminOf(entity: AbstractModel|AbstractGroup): boolean;
  isAdminOfGroup(id: Uri): boolean;
}

export class DefaultUser implements User {

  email: string;
  firstName: string;
  lastName: string;
  anonymous: boolean;
  superuser: boolean;
  rolesInOrganizations: Map<UUID, Set<Role>>;
  organizationsInRole: Map<Role, Set<UUID>>;

  constructor(json: any) {
    this.email = json.email;
    this.firstName = json.firstName;
    this.lastName = json.lastName;
    this.anonymous = json.anonymous;
    this.superuser = json.superuser;
    this.rolesInOrganizations = convertToMapSet<UUID, Role>(json.rolesInOrganizations);
    this.organizationsInRole = convertToMapSet<Role, UUID>(json.organizationsInRole);
  }

  get name() {
    return this.firstName + ' ' + this.lastName;
  }

  getRoles(organizationIds: UUID|UUID[]): Set<Role> {
    return combineResultSets<UUID, Role>(this.rolesInOrganizations, organizationIds);
  }

  getOrganizations(roles: Role|Role[]): Set<UUID> {
    return combineResultSets<Role, UUID>(this.organizationsInRole, roles);
  }

  isInRole(role: Role|Role[], organizationIds: UUID|UUID[]) {
    return hasAny(this.getRoles(organizationIds), role);
  }

  isInOrganization(organizationIds: UUID|UUID[], roles: Role|Role[]) {
    return hasAny(this.getOrganizations(roles), organizationIds);
  }

  isLoggedIn(): boolean {
    return !this.anonymous;
  }

  isMemberOf(_entity: AbstractModel|AbstractGroup): boolean {
    return true;
  }

  isMemberOfGroup(_id: Uri): boolean {
    return true;
  }

  isAdminOf(_entity: AbstractModel|AbstractGroup): boolean {
    return true;
  }

  isAdminOfGroup(_id: Uri): boolean {
    return true;
  }
}

function hasAny<T>(set: Set<T>, values: T|T[]) {

  for (const value of normalizeAsArray(values)) {
    if (set.has(value)) {
      return true;
    }
  }

  return false;
}

function combineResultSets<K, V>(map: Map<K, Set<V>>, keys: K|K[]): Set<V> {

  const normalizedKeys = normalizeAsArray(keys);

  switch (normalizedKeys.length) {
    case 0:
      return new Set<V>();
    case 1:
      return map.get(normalizedKeys[0]) || new Set<V>();
    default:
      const result = new Set<V>();

      for (const key of normalizedKeys) {

        const values = map.get(key);

        if (values) {
          values.forEach(value => result.add(value));
        }
      }

      return result;
  }
}

function getOrCreateSet<K, V>(map: Map<K, Set<V>>, key: K): Set<V> {

  const set = map.get(key);

  if (set) {
    return set;
  } else {
    const newSet = new Set<V>();
    map.set(key, newSet);
    return newSet;
  }
}

function convertToMapSet<K extends string, V extends string>(mapSetLike: { [key: string]: string[] }): Map<K, Set<V>> {

  const map = new Map<K, Set<V>>();

  for (const entry of Object.entries(mapSetLike)) {

    const key = entry[0] as K;
    const values = entry[1] as V[];
    const set = getOrCreateSet(map, key);

    for (const value of values) {
      set.add(value);
    }
  }

  return map;
}
