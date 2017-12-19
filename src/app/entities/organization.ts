import { GraphNode } from './graphNode';
import { localizableSerializer } from './serializer/serializer';
import { init } from './mapping';
import { Localizable } from 'yti-common-ui/types/localization';
import { uriSerializer } from './serializer/entitySerializer';
import { Uri } from './uri';

export class Organization extends GraphNode {

  static organizationMappings = {
    id:             { name: '@id',          serializer: uriSerializer },
    label:          { name: 'prefLabel',    serializer: localizableSerializer }
  };

  id: Uri;
  label: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);

    init(this, Organization.organizationMappings);
  }
}

export class OrganizationListItem {

  uuid: string;
  label: Localizable;
  description: Localizable;
  url: string;

  constructor(json: any) {
    this.uuid = json.uuid;
    this.label = json.prefLabel;
    this.description = json.description;
    this.url = json.url;
  }
}
