import { IFormController, ILogService, IPromise, IScope } from 'angular';
import { UserService } from 'app/services/userService';
import { DeleteConfirmationModal } from 'app/components/common/deleteConfirmationModal';
import { isModalCancel } from 'app/utils/angular';
import { ErrorModal } from './errorModal';
import { LanguageContext } from 'app/types/language';
import { EditableEntity } from 'app/types/entity';
import { DatamodelConfirmationModalService } from 'app/services/confirmation-modal.service';
import { ignoreModalClose } from 'yti-common-ui/utils/modal';

export interface EditableForm extends IFormController {
  editing: boolean;

  // TODO: There is dirty hack in editable.ts to prevent hidden or disabled fields from participating in validation. The hack also
  //       destroys validation of newly created entities IF those flash in non-edit mode first. Based on earlier comments it seems
  //       that going straight to editing state may cause problems with confirmation dialogs, so here comes... another hack. I am sorry.
  // TODO: So basically there are two pending fixes. Firstly, a real solution to validation problem, probably by (shockingly) not rendering
  //       such fields as editable components, hidden or not! Secondly, it makes no sense to "display" resource creation forms before
  //       going to edit mode.
  pendingEdit?: boolean;
}

export interface EditableScope extends IScope {
  form: EditableForm;
}

export interface Rights {
  edit(): boolean;

  remove(): boolean;
}

export abstract class EditableEntityController<T extends EditableEntity> {

  editableInEdit: T | null = null;
  persisting: boolean;

  constructor(protected $scope: EditableScope,
              private $log: ILogService,
              protected deleteConfirmationModal: DeleteConfirmationModal,
              private errorModal: ErrorModal,
              protected userService: UserService,
              private datamodelConfirmationModalService?: DatamodelConfirmationModalService) {

    $scope.$watch(() => userService.isLoggedIn(), (isLoggedIn, wasLoggedIn) => {
      if (!isLoggedIn && wasLoggedIn) {
        this.cancelEditing();
      }
    });

    $scope.$watch(() => this.getEditable(), editable => this.select(editable));
  }

  abstract create(entity: T): IPromise<any>;

  abstract update(entity: T, oldEntity: T): IPromise<any>;

  abstract remove(entity: T): IPromise<any>;

  abstract rights(): Rights;

  abstract getEditable(): T | null;

  abstract setEditable(editable: T | null): void;

  abstract getContext(): LanguageContext;

  abstract confirmChangeToRestrictedStatus(entity: T, oldEntity: T): boolean;

  select(editable: T | null) {
    this.setEditable(editable);
    this.editableInEdit = editable ? <T>editable.clone() : null;

    if (editable && editable.unsaved) {
      // XXX: prevent problems with unsaved navigation confirmation
      this.$scope.form.pendingEdit = true;
      setTimeout(() => this.edit());
    } else {
      this.cancelEditing();
    }
  }

  saveEdited() {

    const editable = this.getEditable();
    const editableInEdit = this.editableInEdit;

    const save = () => {
      this.persisting = true;

      (editable!.unsaved ? this.create(editableInEdit!) : this.update(editableInEdit!, editable!))
        .then(() => {
          this.select(editableInEdit);
          this.persisting = false;
        }, (err: any) => {
          if (err) {
            this.$log.error(err);
            this.errorModal.openSubmitError((err.data && err.data.errorMessage) || 'Unexpected error');
          }
          this.persisting = false;
        });
    };

    if (this.confirmChangeToRestrictedStatus(editableInEdit!, editable!) && this.datamodelConfirmationModalService) {
      this.datamodelConfirmationModalService.openChangeToRestrictedStatus().then(() => save(), ignoreModalClose);
    } else {
      save();
    }

  }

  openDeleteConfirmationModal(): IPromise<void> {
    return this.deleteConfirmationModal.open(this.getEditable()!, this.getContext());
  }

  removeEdited() {

    const editable = this.getEditable();
    this.persisting = true;
    this.openDeleteConfirmationModal()
      .then(() => this.remove(editable!))
      .then(() => {
        this.select(null);
        this.persisting = false;
      }, err => {
        if (!isModalCancel(err)) {
          this.$log.error(err);
          this.errorModal.openSubmitError((err.data && err.data.errorMessage) || 'Unexpected error');
        }
        this.persisting = false;
      });
  }

  canRemove() {
    const editable = this.getEditable();
    return editable && !editable.unsaved && !this.isEditing() && this.rights().remove();
  }

  cancelEditing() {
    if (this.isEditing()) {
      this.$scope.form.editing = false;
      this.$scope.form.$setPristine();
      const editable = this.getEditable();
      this.select(editable!.unsaved ? null : editable);
    }
  }

  edit() {
    this.$scope.form.pendingEdit = undefined;
    this.$scope.form.editing = true;
  }

  isEditing(): boolean {
    return this.$scope.form && this.$scope.form.editing;
  }

  canEdit(): boolean {
    return !this.isEditing() && this.rights().edit();
  }

  getRemoveText(): string {
    return 'Delete ' + this.getEditable()!.normalizedType;
  }
}
