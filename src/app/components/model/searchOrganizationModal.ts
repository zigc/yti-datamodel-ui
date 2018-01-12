import { IPromise, IScope, ui } from 'angular';
import { Classification } from '../../entities/classification';
import { Exclusion } from '../../utils/exclusion';
import { Organization } from '../../entities/organization';
import { OrganizationService } from '../../services/organizationService';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { AuthorizationManagerService } from '../../services/authorizationManagerService';

export class SearchOrganizationModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(exclude: Exclusion<Organization>): IPromise<Organization> {
    return this.$uibModal.open({
      template: require('./searchOrganizationModal.html'),
      size: 'medium',
      resolve: {
        exclude: () => exclude
      },
      controller: SearchOrganizationModalController,
      controllerAs: 'ctrl'
    }).result;
  }
}

class SearchOrganizationModalController {

  organizations: Organization[];
  close = this.$uibModalInstance.dismiss;

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              organizationService: OrganizationService,
              authorizationManagerService: AuthorizationManagerService,
              exclude: Exclusion<Organization>) {

    organizationService.getOrganizations()
      .then(organizations =>
        this.organizations = authorizationManagerService.filterOrganizationsAllowedForUser(organizations.filter(c => !exclude(c))));
  }

  get loading() {
    return this.organizations == null;
  }

  select(classification: Classification) {
    this.$uibModalInstance.close(classification);
  }
}
