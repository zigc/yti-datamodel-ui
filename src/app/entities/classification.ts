import { GraphNode } from './graphNode';
import { localizableSerializer, stringSerializer } from './serializer/serializer';
import { init } from './mapping';
import { Localizable } from 'yti-common-ui/types/localization';
import { uriSerializer } from './serializer/entitySerializer';
import { Uri } from './uri';

export class Classification extends GraphNode {

  static classificationMappings = {
    id:             { name: '@id',          serializer: uriSerializer },
    label:          { name: 'label',        serializer: localizableSerializer },
    identifier:     { name: 'identifier',   serializer: stringSerializer }
  };

  id: Uri;
  label: Localizable;
  identifier: string;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);

    init(this, Classification.classificationMappings);
  }
}
