import { localizableSerializer, stringSerializer, optional } from './serializer/serializer';
import { Uri } from './uri';
import { createConstantLocalizable } from '../utils/language';
import { init } from './mapping';
import { GraphNode } from './graphNode';
import { uriSerializer, entityAwareList, entity } from './serializer/entitySerializer';
import { Localizable } from 'yti-common-ui/types/localization';
import { Classification } from './classification';

export class DefinedBy extends GraphNode {

  static definedByMapping = {
    id: { name: '@id', serializer: uriSerializer },
    label: { name: 'label', serializer: localizableSerializer },
    prefix: { name: 'preferredXMLNamespacePrefix', serializer: optional(stringSerializer) },
    classifications: { name: 'isPartOf',    serializer: entityAwareList(entity(() => Classification)) }
  };

  id: Uri;
  label: Localizable;
  prefix: string|null;
  classifications: Classification[];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);

    if (typeof graph === 'string' || graph instanceof String) {
      const str = (graph instanceof String) ? graph.valueOf() : graph;
      this.id = uriSerializer.deserialize(str, this);
      this.label = createConstantLocalizable(this.id.uri);
      this.prefix = null;
    } else if (typeof graph === 'object') {
      init(this, DefinedBy.definedByMapping);
    } else {
      throw new Error('Unsupported is defined sub-graph');
    }
  }
}
