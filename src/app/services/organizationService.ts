import { IHttpService, IPromise } from 'angular';
import { config } from 'config';
import { OrganizationListItem } from '../entities/organization';

export class OrganizationService {

  /* @ngInject */
  constructor(private $http: IHttpService) {
  }

  getOrganizations(): IPromise<OrganizationListItem[]> {
    return this.$http.get<any[]>(config.apiEndpointWithName('organizations'))
      .then(response => response.data!.map(datum => new OrganizationListItem(datum)));
  }
}
