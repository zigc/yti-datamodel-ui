import { IHttpService, IPromise } from 'angular';
import { apiEndpointWithName } from './config';
import { Organization } from 'app/entities/organization';
import * as frames from 'app/entities/frames';
import { GraphData } from 'app/types/entity';
import { FrameService } from './frameService';

export interface OrganizationService {
  getOrganizations(): IPromise<Organization[]>;
}

export class DefaultOrganizationService implements OrganizationService {

  constructor(private $http: IHttpService,
              private frameService: FrameService) {
    'ngInject';
  }

  getOrganizations(): IPromise<Organization[]> {
    return this.$http.get<GraphData>(apiEndpointWithName('organizations'))
      .then(response => this.deserializeOrganization(response.data!));
  }

  private deserializeOrganization(data: GraphData): IPromise<Organization[]> {
    return this.frameService.frameAndMapArray(data, frames.organizationFrame(data), () => Organization);
  }
}
