import { IPromise, IScope } from 'angular';
import { Classification } from 'app/entities/classification';
import { Exclusion } from 'app/utils/exclusion';
import { Organization } from 'app/entities/organization';
import { OrganizationService } from 'app/services/organizationService';
import { IModalService, IModalServiceInstance } from 'angular-ui-bootstrap';
import { AuthorizationManagerService } from 'app/services/authorizationManagerService';

export class SearchOrganizationModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(exclude: Exclusion<Organization>): IPromise<Organization> {
    return this.$uibModal.open({
      template: require('./searchOrganizationModal.html'),
      size: 'md',
      resolve: {
        exclude: () => exclude
      },
      controller: SearchOrganizationModalController,
      controllerAs: '$ctrl'
    }).result;
  }
}

class SearchOrganizationModalController {

  organizations?: Organization[];

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

  close() {
    this.$uibModalInstance.dismiss('cancel');
  }
}
