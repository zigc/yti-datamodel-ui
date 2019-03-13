import { Predicate } from 'app/entities/predicate';
import { Class } from 'app/entities/class';

export interface View {
  isEditing(): boolean;
  cancelEditing(): void;
}

export interface EditorContainer {
  registerView(view: View): void;
  deregisterView(view: View): void;
  editingViews(): View[];
}

export interface EditingGuard {
  attemptRouteChange(delay: () => void, proceed: () => void): void;
}

export interface ModelControllerService {
  selectionEdited(oldSelection: Class|Predicate|null, newSelection: Class|Predicate): void;
  selectionDeleted(selection: Class|Predicate): void;
}
