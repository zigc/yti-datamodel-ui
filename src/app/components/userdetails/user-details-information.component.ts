import { Component, OnDestroy } from '@angular/core';
import { Role, UserService } from 'yti-common-ui/services/user.service';
import { Subscription } from 'rxjs';
import { Organization } from '../../entities/organization';
import { LanguageService } from '../../services/languageService';
import { combineSets, hasAny } from 'yti-common-ui/utils/set';
import { Options } from 'yti-common-ui/components/dropdown.component';
import { comparingLocalizable } from '../../utils/comparator';
import { index } from 'yti-common-ui/utils/array';
import {
  GettextCatalogWrapper,
  LocationServiceWrapper,
  OrganizationServiceWrapper,
  UserRoleServiceWrapper
} from '../../ajs-upgraded-providers';

interface UserOrganizationRoles {
  organization?: Organization;
  roles: Role[];
  requests: Role[];
}

@Component({
  selector: 'app-user-details-information',
  templateUrl: './user-details-information.component.html',
})
export class UserDetailsInformationComponent implements OnDestroy {

  private subscriptionToClean: Subscription[] = [];

  userOrganizations: UserOrganizationRoles[];
  organizationOptions: Options<Organization>;
  allOrganizations: Organization[];
  allOrganizationsById: Map<string, Organization>;
  selectedOrganization: Organization | null = null;
  requestsInOrganizations = new Map<string, Set<Role>>();

  constructor(private locationServiceWrapper: LocationServiceWrapper,
              private userService: UserService,
              private languageService: LanguageService,
              private userRoleServiceWrapper: UserRoleServiceWrapper,
              private organizationServiceWrapper: OrganizationServiceWrapper,
              private gettextCatalogWrapper: GettextCatalogWrapper) {

    this.subscriptionToClean.push(this.userService.loggedIn$.subscribe(loggedIn => {
      if (!loggedIn) {
        locationServiceWrapper.locationService.url('/');
      }
    }));

    this.organizationServiceWrapper.organizationService.getOrganizations().then(organizations => {
      this.allOrganizations = organizations;
      this.allOrganizationsById = index(organizations, org => org.id.uuid);
      this.reloadUserOrganizations();
      this.reloadOrganizationOptions();
      this.refreshRequests();
    });
  }

  ngOnDestroy() {

    this.subscriptionToClean.forEach(s => s.unsubscribe());
  }

  get user() {

    return this.userService.user;
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
                        : this.gettextCatalogWrapper.gettextCatalog.getString('Choose organization')
      };
    });
  }

  sendRequest() {

    if (!this.selectedOrganization) {
      throw new Error('No organization selected for request');
    }

    this.userRoleServiceWrapper.userRoleService.sendUserRequest(this.selectedOrganization.id)
      .then(() => this.refreshRequests());
  }

  refreshRequests() {

    this.selectedOrganization = null;

    this.userRoleServiceWrapper.userRoleService.getUserRequests().then(userRequests => {

      this.requestsInOrganizations.clear();

      for (const userRequest of userRequests) {
        this.requestsInOrganizations.set(userRequest.organizationId, new Set<Role>(userRequest.role));
      }

      this.reloadUserOrganizations();
      this.reloadOrganizationOptions();
    });
  }
}
