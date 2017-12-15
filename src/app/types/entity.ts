import { Uri } from 'app/entities/uri';
import { GraphNode, GraphNodes } from 'app/entities/graphNode';
import { Localizable } from 'yti-common-ui/types/localization';
import { DefinedBy } from 'app/entities/definedBy';

export type Type = ModelType
                 | ClassType
                 | PredicateType
                 | ConceptType
                 | GroupType
                 | 'constraint'
                 | 'user'
                 | 'entity'
                 | 'activity'
                 | 'resource'
                 | 'collection'
                 | 'material'
                 | 'vocabulary'
                 | 'standard'
                 | 'referenceData'
                 | 'externalReferenceData'
                 | 'referenceDataGroup'
                 | 'referenceDataCode';

export type GroupType = 'group';

export type ModelType = KnownModelType
                      | 'model';

export type KnownModelType = 'library'
                           | 'profile';

export type ClassType = 'class'
                      | 'shape';

export type PredicateType = KnownPredicateType
                          | 'property';

export type KnownPredicateType = 'attribute'
                               | 'association';

export type ConceptType = 'concept'

export type SelectionType = 'class'
                          | 'predicate';

export type State = 'Unstable'
                  | 'Draft'
                  | 'Recommendation'
                  | 'Deprecated';

export type ConstraintType = 'or'
                           | 'and'
                           | 'not';

export interface GraphData {
  '@context': any;
  '@graph': any;
}

export interface EntityConstructor<T extends GraphNode> {
  new(graph: any, context: any, frame: any): T;
}

export interface EntityArrayConstructor<T extends GraphNode, A extends GraphNodes<T>> {
  new(graph: any[], context: any, frame: any): A;
}

export type EntityFactory<T extends GraphNode> = (framedData: any) => EntityConstructor<T>;
export type EntityArrayFactory<T extends GraphNode, A extends GraphNodes<T>> = (framedData: any) => EntityArrayConstructor<T, A>;

export interface EditableEntity {
  id: Uri;
  label: Localizable;
  normalizedType: Type;
  unsaved: boolean;
  isOfType(type: Type): boolean;
  clone<T>(): T;
  serialize<T>(): T;
}

export interface WithId {
  id: Uri|string;
}

export interface WithDefinedBy {
  definedBy: DefinedBy;
}

export interface WithIdAndType {
  id: Uri;
  type: Type[];
}

export interface Destination {
  id: Uri;
  type: Type[];
  prefix: string|null;
  definedBy: DefinedBy|null;
}
