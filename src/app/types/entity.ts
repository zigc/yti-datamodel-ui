import { Uri } from '../entities/uri';
import { GraphNode, GraphNodes } from '../entities/graphNode';
import { Localizable } from 'yti-common-ui/types/localization';
import { DefinedBy } from '../entities/definedBy';
import { ChainableComparator } from 'yti-common-ui/utils/comparator';
import { TextAnalysis } from './filter';
import { ClassListItem } from '../entities/class';
import { PredicateListItem } from '../entities/predicate';

export type Type = ModelType
                 | ClassType
                 | PredicateType
                 | ConceptType
                 | GroupType
                 | 'organization'
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

export type DefinedByType = KnownModelType
                            | 'standard';

export type ClassType = 'class'
                      | 'shape';

export type PredicateType = KnownPredicateType
                          | 'property';

export type KnownPredicateType = 'attribute'
                               | 'association';

export type ConceptType = 'concept'

export type SelectionType = 'class'
                          | 'predicate';

export type ConstraintType = 'or'
                           | 'and'
                           | 'not';

export type UseContext = 'InformationPool'
                       | 'InformationSystem'
                       | 'ExchangeFormat'
                       | 'InformationDescription';

export type ClassRelationType = 'prov:wasDerivedFrom'
                              | 'rdfs:subClassOf'
                              | 'iow:superClassOf';

export type PredicateRelationType = 'prov:wasDerivedFrom'
                                  | 'rdfs:subPropertyOf'
                                  | 'iow:superPropertyOf';

export const profileUseContexts: UseContext[] = ['InformationPool', 'InformationSystem', 'ExchangeFormat', 'InformationDescription'];
export const libraryUseContexts: UseContext[] = ['InformationDescription'];

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
  clone(): this;
  serialize(): any;
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

export type SortByTableColumn = 'name'
                              | 'model'
                              | 'description'
                              | 'modifiedAt';

export interface SortBy<T> {
  name: SortByTableColumn;
  comparator: ChainableComparator<TextAnalysis<T>>;
  descOrder: boolean;
}

export type ListItem = ClassListItem | PredicateListItem;
