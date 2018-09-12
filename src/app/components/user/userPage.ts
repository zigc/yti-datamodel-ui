import { ILocationService, IScope } from 'angular';
import { UserService } from 'app/services/userService';
import { LocationService } from 'app/services/locationService';
import { Role, User } from 'yti-common-ui/services/user.service';
import { Organization } from 'app/entities/organization';
import { index } from 'yti-common-ui/utils/array';
import { comparingLocalizable } from 'app/utils/comparator';
import { LanguageService } from 'app/services/languageService';
import { OrganizationService } from 'app/services/organizationService';
import { Options } from 'yti-common-ui/components/dropdown.component';
import { combineSets, hasAny } from 'yti-common-ui/utils/set';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { UserRoleService } from 'app/services/userRoleService';
import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

interface UserOrganizationRoles {
  organization?: Organization;
  roles: Role[];
  requests: Role[];
}

export const UserPageComponent: ComponentDeclaration = {
  selector: 'userPage',
  template: require('./userPage.html'),
  controller: forwardRef(() => UserPageController)
};

// TODO clean the implementation
class UserPageController {

  userOrganizations: UserOrganizationRoles[];
  organizationOptions: Options<Organization>;
  allOrganizations: Organization[];
  allOrganizationsById: Map<string, Organization>;
  selectedOrganization: Organization | null = null;
  requestsInOrganizations = new Map<string, Set<Role>>();

  constructor($scope: IScope,
              $location: ILocationService,
              private userService: UserService,
              locationService: LocationService,
              organizationService: OrganizationService,
              private gettextCatalog: GettextCatalog,
              private languageService: LanguageService,
              private userRoleService: UserRoleService) {
    'ngInject';
    locationService.atUser();

    $scope.$watch(() => userService.user, user => {
      if (user.anonymous) {
        $location.url('/');
      }
    });

    userService.updateLoggedInUser();

    organizationService.getOrganizations().then(organizations => {
      this.allOrganizations = organizations;
      this.allOrganizationsById = index(organizations, org => org.id.uuid);
      this.reloadUserOrganizations();
      this.reloadOrganizationOptions();
    });

    this.refreshRequests();
  }

  get user(): User {
    return this.userService.user as User;
  }

  get loading() {
    return !this.allOrganizations || !this.requestsInOrganizations;
  }

  private reloadUserOrganizations() {

    const organizationIds = new Set<string>([
      ...Array.from(this.user.rolesInOrganizations.keys()),
      ...Array.from(this.requestsInOrganizations.keys())
    ]);

    const result = Array.from(organizationIds.values()).map(organizationId => {
      return {
        organization: this.allOrganizationsById.get(organizationId),
        roles: Array.from(this.user.getRoles(organizationId)),
        requests: Array.from(this.requestsInOrganizations.get(organizationId) || [])
      };
    });

    result.sort(comparingLocalizable<UserOrganizationRoles>(this.languageService.createLocalizer(), org =>
      org.organization ? org.organization.label : {}));

    this.userOrganizations = result;
  }

  private reloadOrganizationOptions() {

    const hasExistingRoleOrRequest = (org: Organization) => {

      const rolesOrRequests = combineSets([
        this.user.getRoles(org.id.uuid),
        this.requestsInOrganizations.get(org.id.uuid) || new Set<Role>()
      ]);

      return hasAny(rolesOrRequests, ['DATA_MODEL_EDITOR', 'ADMIN']);
    };

    const requestableOrganizations = this.allOrganizations.filter(organization => !hasExistingRoleOrRequest(organization));

    this.organizationOptions = [null, ...requestableOrganizations].map(org => {
      return {
        value: org,
        name: () => org ? this.languageService.translate(org.label)
          : this.gettextCatalog.getString('Choose organization')
      };
    });
  }

  sendRequest() {

    if (!this.selectedOrganization) {
      throw new Error('No organization selected for request');
    }

    this.userRoleService.sendUserRequest(this.selectedOrganization.id)
      .then(() => this.refreshRequests());
  }

  refreshRequests() {

    this.selectedOrganization = null;

    this.userRoleService.getUserRequests().then(userRequests => {

      this.requestsInOrganizations.clear();

      for (const userRequest of userRequests) {
        this.requestsInOrganizations.set(userRequest.organizationId, new Set<Role>(userRequest.role));
      }

      this.reloadUserOrganizations();
      this.reloadOrganizationOptions();
    });
  }
}
