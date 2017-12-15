import { Predicate } from 'app/entities/predicate';
import { Class } from 'app/entities/class';

export interface View {
  isEditing(): boolean;
  cancelEditing(): void;
}

export interface ModelControllerService {
  registerView(view: View): void;
  getUsedNamespaces(): Set<string>;
  selectionEdited(oldSelection: Class|Predicate|null, newSelection: Class|Predicate): void;
  selectionDeleted(selection: Class|Predicate): void;
}
