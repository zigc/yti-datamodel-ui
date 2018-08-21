import { Uri } from './uri';
import { init, serialize } from './mapping';
import { GraphNode } from './graphNode';
import { uriSerializer, entityAwareList, entity } from './serializer/entitySerializer';
import { optional, stringSerializer, localizableSerializer } from './serializer/serializer';
import { Localizable } from 'yti-common-ui/types/localization';
import { Status } from 'yti-common-ui/entities/status';

export class ReferenceDataServer extends GraphNode {

  static referenceDataServerMappings = {
    id:          { name: '@id',         serializer: uriSerializer },
    identifier:  { name: 'identifier',  serializer: optional(stringSerializer) },
    description: { name: 'description', serializer: localizableSerializer },
    title:       { name: 'title',       serializer: localizableSerializer }
  };

  id: Uri;
  identifier: string|null;
  description: Localizable;
  title: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, ReferenceDataServer.referenceDataServerMappings);
  }
}

export class ReferenceDataGroup extends GraphNode {

  static referenceDataGroupMappings = {
    id:          { name: '@id',         serializer: uriSerializer },
    title:       { name: 'title',       serializer: localizableSerializer }
  };

  id: Uri;
  title: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, ReferenceDataGroup.referenceDataGroupMappings);
  }
}

export class ReferenceData extends GraphNode {

  static referenceDataMappings = {
    id:          { name: '@id',         serializer: uriSerializer },
    title:       { name: 'title',       serializer: localizableSerializer },
    description: { name: 'description', serializer: localizableSerializer },
    creator:     { name: 'creator',     serializer: optional(stringSerializer) },
    identifier:  { name: 'identifier',  serializer: optional(stringSerializer) },
    groups:      { name: 'isPartOf',    serializer: entityAwareList(entity(() => ReferenceDataGroup))},
    status:      { name: 'status',      serializer: stringSerializer }
  };

  id: Uri;
  title: Localizable;
  description: Localizable;
  creator: string|null;
  identifier: string|null;
  groups: ReferenceDataGroup[];
  status: Status;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, ReferenceData.referenceDataMappings);
  }

  isExternal() {
    return this.isOfType('externalReferenceData');
  }

  serializationValues(_inline: boolean, clone: boolean): {} {
    return serialize(this, clone, ReferenceData.referenceDataMappings);
  }
}

export class ReferenceDataCode extends GraphNode {

  static referenceDataCodeMappings = {
    id:          { name: '@id',         serializer: uriSerializer },
    title:       { name: 'title',       serializer: localizableSerializer },
    identifier:  { name: 'identifier',  serializer: optional(stringSerializer) },
    status:      { name: 'status',      serializer: stringSerializer }
  };

  id: Uri;
  title: Localizable;
  identifier?: string;
  status: Status;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, ReferenceDataCode.referenceDataCodeMappings);
  }
}
