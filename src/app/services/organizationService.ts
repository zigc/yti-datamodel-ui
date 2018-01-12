import { IHttpService, IPromise } from 'angular';
import { config } from 'config';
import { Organization } from '../entities/organization';
import * as frames from '../entities/frames';
import { GraphData } from '../types/entity';
import { FrameService } from './frameService';

export class OrganizationService {

  /* @ngInject */
  constructor(private $http: IHttpService,
              private frameService: FrameService) {
  }

  getOrganizations(): IPromise<Organization[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('organizations'))
      .then(response => this.deserializeOrganization(response.data!));
  }

  private deserializeOrganization(data: GraphData): IPromise<Organization[]> {
    return this.frameService.frameAndMapArray(data, frames.organizationFrame(data), () => Organization);
  }
}
