import { Predicate } from 'app/entities/predicate';
import { Class } from 'app/entities/class';

export interface View {
  isEditing(): boolean;
  cancelEditing(): void;
}

export interface ModelControllerService {
  namespacesInUse: Set<string>;
  registerView(view: View): void;
  selectionEdited(oldSelection: Class|Predicate|null, newSelection: Class|Predicate): void;
  selectionDeleted(selection: Class|Predicate): void;
}
