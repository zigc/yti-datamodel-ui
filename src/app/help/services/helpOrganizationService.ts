import { OrganizationService } from 'app/services/organizationService';
import { IPromise, IQService } from 'angular';
import { Organization } from 'app/entities/organization';
import { EntityCreatorService, OrganizationDetails } from './entityCreatorService';
import { ResourceStore } from './resourceStore';

export class InteractiveHelpOrganizationService implements OrganizationService {

  private store = new ResourceStore<Organization>();

  constructor(private $q: IQService,
              private entityCreatorService: EntityCreatorService) {
    'ngInject';
  }

  createOrganization(organization: OrganizationDetails) {
    return this.entityCreatorService.createOrganization(organization)
      .then(o => this.store.add(o));
  }

  getOrganizations(): IPromise<Organization[]> {
    return this.$q.when(this.store.values());
  }
}
