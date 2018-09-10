import { OrganizationService } from 'app/services/organizationService';
import { IPromise } from 'angular';
import { Organization } from 'app/entities/organization';
import { GraphData } from 'app/types/entity';
import * as frames from 'app/entities/frames';
import { FrameService } from 'app/services/frameService';

export const helpOrganizationId = 'urn:uuid:74a41211-8c99-4835-a519-7a61612b1098';

const helpOrganizationsResponse = {
  '@graph' : [ {
    '@id' : helpOrganizationId,
    '@type' : 'http://xmlns.com/foaf/0.1/Organization',
    'prefLabel' : [ {
      '@language' : 'fi',
      '@value' : 'Ohjeen organisaatio'
    }, {
      '@language' : 'en',
      '@value' : 'Help organization'
    }],
  }],
  '@context' : {
    'homepage' : {
      '@id' : 'http://xmlns.com/foaf/0.1/homepage'
    },
    'prefLabel' : {
      '@id' : 'http://www.w3.org/2004/02/skos/core#prefLabel'
    },
    'description' : {
      '@id' : 'http://purl.org/dc/terms/description'
    }
  }
};

export class InteractiveHelpOrganizationService implements OrganizationService {

  /* @ngInject */
  constructor(private frameService: FrameService) {
  }

  getOrganizations(): IPromise<Organization[]> {
    return this.deserializeOrganization(helpOrganizationsResponse);
  }

  private deserializeOrganization(data: GraphData): IPromise<Organization[]> {
    return this.frameService.frameAndMapArray(data, frames.organizationFrame(data), () => Organization);
  }
}
