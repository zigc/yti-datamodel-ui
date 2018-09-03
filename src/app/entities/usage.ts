import { EditableEntity, Type } from 'app/types/entity';
import { Uri } from './uri';
import { localizableSerializer, stringSerializer, optional } from './serializer/serializer';
import { DefinedBy } from './definedBy';
import { contextlessInternalUrl, normalizeReferrerType } from 'app/utils/entity';
import { init } from './mapping';
import { GraphNode } from './graphNode';
import { uriSerializer, entityAwareOptional, entity, entityAwareList } from './serializer/entitySerializer';
import { Localizable } from 'yti-common-ui/types/localization';

export interface Usage {
  id: Uri;
  label: Localizable;
  referrers: Referrer[];
}

export class DefaultUsage extends GraphNode implements Usage {

  static defaultUsageMappings = {
    id:        { name: '@id',            serializer: uriSerializer },
    label:     { name: 'label',          serializer: localizableSerializer },
    definedBy: { name: 'isDefinedBy',    serializer: entityAwareOptional(entity(() => DefinedBy)) },
    referrers: { name: 'isReferencedBy', serializer: entityAwareList(entity(() => Referrer))}
  };

  id: Uri;
  label: Localizable;
  definedBy: DefinedBy|null;
  referrers: Referrer[];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, DefaultUsage.defaultUsageMappings);
  }
}

export class EmptyUsage implements Usage {

  id: Uri;
  label: Localizable;
  referrers: Referrer[] = [];

  constructor(editableEntity: EditableEntity) {
    this.id = editableEntity.id;
    this.label = editableEntity.label;
  }
}

export class Referrer extends GraphNode {

  static referrerMappings = {
    id:        { name: '@id',                         serializer: uriSerializer },
    label:     { name: 'label',                       serializer: localizableSerializer },
    prefix:    { name: 'preferredXMLNamespacePrefix', serializer: optional(stringSerializer) },
    definedBy: { name: 'isDefinedBy',                 serializer: entityAwareOptional(entity(() => DefinedBy)) }
  };

  id: Uri;
  label: Localizable;
  prefix: string|null;
  definedBy: DefinedBy|null;
  normalizedType: Type|null = normalizeReferrerType(this.type);

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, Referrer.referrerMappings);
  }

  iowUrl() {
    return contextlessInternalUrl(this);
  }
}
