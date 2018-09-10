import { ILogService } from 'angular';
import { PredicateService } from 'app/services/predicateService';
import { UserService } from 'app/services/userService';
import { EditableEntityController, EditableScope, Rights } from 'app/components/form/editableEntityController';
import { DeleteConfirmationModal } from 'app/components/common/deleteConfirmationModal';
import { ErrorModal } from 'app/components/form/errorModal';
import { Association, Attribute } from 'app/entities/predicate';
import { Model } from 'app/entities/model';
import { LanguageContext } from 'app/types/language';
import { ModelControllerService } from 'app/components/model/modelControllerService';
import { AuthorizationManagerService } from 'app/services/authorizationManagerService';
 import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const PredicateViewComponent: ComponentDeclaration = {
  selector: 'predicateView',
  bindings: {
    id: '=',
    predicate: '=',
    model: '=',
    modelController: '=',
    width: '='
  },
  template: require('./predicateView.html'),
  controller: forwardRef(() => PredicateViewController)
};

export class PredicateViewController extends EditableEntityController<Association|Attribute> {

  predicate: Association|Attribute;
  model: Model;
  modelController: ModelControllerService;

  /* @ngInject */
  constructor($scope: EditableScope,
              $log: ILogService,
              deleteConfirmationModal: DeleteConfirmationModal,
              errorModal: ErrorModal,
              private predicateService: PredicateService,
              userService: UserService,
              private authorizationManagerService: AuthorizationManagerService) {
    super($scope, $log, deleteConfirmationModal, errorModal, userService);
  }

  $onInit() {
    this.modelController.registerView(this);
  }

  create(entity: Association|Attribute) {
    return this.predicateService.createPredicate(entity).then(() => this.modelController.selectionEdited(null, entity));
  }

  update(entity: Association|Attribute, oldEntity: Association|Attribute) {
    return this.predicateService.updatePredicate(entity, oldEntity.id).then(() => this.modelController.selectionEdited(oldEntity, entity));
  }

  remove(entity: Association|Attribute) {
    return this.predicateService.deletePredicate(entity.id, this.model).then(() => this.modelController.selectionDeleted(entity));
  }

  rights(): Rights {
    return {
      edit: () => this.authorizationManagerService.canEditPredicate(this.model, this.predicate),
      remove: () => this.authorizationManagerService.canRemovePredicate(this.model, this.predicate)
    };
  }

  getEditable(): Association|Attribute {
    return this.predicate;
  }

  setEditable(editable: Association|Attribute) {
    this.predicate = editable;
  }

  isReference(): boolean {
    return this.predicate.definedBy.id.notEquals(this.model.id);
  }

  getRemoveText(): string {
    const text = super.getRemoveText();
    return !this.isReference() ? text : text + ' from this ' + this.model.normalizedType;
  }

  openDeleteConfirmationModal() {
    const onlyDefinedInModel = this.isReference() ? this.model : null;
    return this.deleteConfirmationModal.open(this.getEditable(), this.getContext(), onlyDefinedInModel);
  }

  getContext(): LanguageContext {
    return this.model;
  }
}
