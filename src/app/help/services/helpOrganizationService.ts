import { OrganizationService } from 'app/services/organizationService';
import { IPromise } from 'angular';
import { Organization } from 'app/entities/organization';
import { Uri } from 'app/entities/uri';
import { EntityCreatorService } from './entityCreatorService';
import { Localizable } from 'yti-common-ui/types/localization';

export const helpOrganizationName: Localizable = {
  fi: 'Ohjeen organisaatio',
  en: 'Help organization'
};

export const helpOrganizationId = 'urn:uuid:74a41211-8c99-4835-a519-7a61612b1098';

// TODO Move organization initialization as EntityLoader responsibility
export class InteractiveHelpOrganizationService implements OrganizationService {

  constructor(private entityCreatorService: EntityCreatorService) {
    'ngInject';
  }

  getOrganizations(): IPromise<Organization[]> {
    return this.entityCreatorService.createOrganizations([
      {
        id: Uri.fromUUID(helpOrganizationId),
        label: helpOrganizationName
      }
    ]);
  }
}
