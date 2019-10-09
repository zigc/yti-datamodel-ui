import { localizableSerializer, stringSerializer } from './serializer/serializer';
import { Uri } from './uri';
import { glyphIconClassForType } from 'app/utils/entity';
import { init, serialize } from './mapping';
import { GraphNode } from './graphNode';
import { entity, entityAwareOptional, uriSerializer } from 'app/entities/serializer/entitySerializer';
import { ConceptType } from 'app/types/entity';
import { Localizable } from 'yti-common-ui/types/localization';

export class Vocabulary extends GraphNode {

  static vocabularyMappings = {
    id:              { name: '@id',         serializer: uriSerializer },
    title:           { name: 'prefLabel',   serializer: localizableSerializer },
    description:     { name: 'description', serializer: localizableSerializer }
  };

  id: Uri;
  title: Localizable;
  description: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, Vocabulary.vocabularyMappings);
  }
}

export class Concept extends GraphNode {

  static conceptMappings = {
    id:             { name: '@id',               serializer: uriSerializer },
    label:          { name: 'prefLabel',         serializer: localizableSerializer },
    definition:     { name: 'definition',        serializer: localizableSerializer },
    vocabulary:     { name: 'inScheme',          serializer: entityAwareOptional(entity(() => ConceptVocabulary)) } // TODO should be mandatory
  };

  id: Uri;
  label: Localizable;
  definition: Localizable;
  vocabulary: ConceptVocabulary;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, Concept.conceptMappings);
  }

  get unsaved() {
    return false;
  }

  get normalizedType(): ConceptType {
    return 'concept';
  }

  get glyphIconClass() {
    return glyphIconClassForType(this.type);
  }

  clone(): Concept {
    const serialization = this.serialize(false, true);
    return new Concept(serialization['@graph'], serialization['@context'], this.frame);
  }

  serializationValues(_inline: boolean, clone: boolean): {} {
    return serialize(this, clone, Concept.conceptMappings);
  }
}

export class ConceptVocabulary extends GraphNode {

  static conceptVocabularyMappings = {
    id:              { name: '@id',         serializer: uriSerializer },
    title:           { name: 'prefLabel',   serializer: localizableSerializer }
  };

  id: Uri;
  title: Localizable;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, ConceptVocabulary.conceptVocabularyMappings);
  }
}
