export enum Show {
  Selection = 0, Both = 1, Visualization = 2
}

export interface ChangeListener<T> {
  onEdit(newItem: T, oldItem: T|null): void;
  onDelete(item: T): void;
  onAssign(item: T): void;
  onResize(show: Show): void;
}

export interface ChangeNotifier<T> {
  addListener(listener: ChangeListener<T>): void;
}

export enum SearchClassType {
  Class, Shape, SpecializedClass
}
