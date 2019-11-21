import { ILogService } from 'angular';
import { EditableEntityController, EditableScope, Rights } from 'app/components/form/editableEntityController';
import { ClassService } from 'app/services/classService';
import { SearchPredicateModal } from './searchPredicateModal';
import { UserService } from 'app/services/userService';
import { DeleteConfirmationModal } from 'app/components/common/deleteConfirmationModal';
import { ErrorModal } from 'app/components/form/errorModal';
import { LegacyComponent, modalCancelHandler } from 'app/utils/angular';
import { Class } from 'app/entities/class';
import { Model } from 'app/entities/model';
import { LanguageContext } from 'app/types/language';
import { EditorContainer, ModelControllerService } from 'app/components/model/modelControllerService';
import { AuthorizationManagerService } from 'app/services/authorizationManagerService';

@LegacyComponent({
  bindings: {
    id: '@',
    class: '=',
    model: '=',
    modelController: '<',
    parent: '<',
    openPropertyId: '='
  },
  template: require('./classView.html')
})
export class ClassViewComponent extends EditableEntityController<Class> {

  class: Class;
  model: Model;
  modelController: ModelControllerService;
  parent: EditorContainer;
  openPropertyId: string;

  constructor($scope: EditableScope,
              $log: ILogService,
              private searchPredicateModal: SearchPredicateModal,
              deleteConfirmationModal: DeleteConfirmationModal,
              errorModal: ErrorModal,
              private classService: ClassService,
              userService: UserService,
              private authorizationManagerService: AuthorizationManagerService) {
    'ngInject';
    super($scope, $log, deleteConfirmationModal, errorModal, userService);
  }

  $onInit() {
    this.parent.registerView(this);

    this.$scope.$watch(() => this.getEditable().properties, props => this.select(this.getEditable()));
  }

  $onDestroy() {
    this.parent.deregisterView(this);
  }

  addProperty() {
    this.searchPredicateModal.openAddProperty(this.model, this.editableInEdit!)
      .then(property => {
        this.editableInEdit!.addProperty(property);
        this.openPropertyId = property.internalId.uuid;
      }, modalCancelHandler);
  }

  create(entity: Class) {
    return this.classService.createClass(entity)
      .then(() => this.modelController.selectionEdited(null, entity));
  }

  update(entity: Class, oldEntity: Class) {
    return this.classService.updateClass(entity, oldEntity.id).then(() => this.modelController.selectionEdited(oldEntity, entity));
  }

  remove(entity: Class) {
    return this.classService.deleteClass(entity.id, this.model).then(() => this.modelController.selectionDeleted(entity));
  }

  rights(): Rights {
    return {
      edit: () => this.authorizationManagerService.canEditClass(this.model, this.class),
      remove: () => this.authorizationManagerService.canRemoveClass(this.model, this.class)
    };
  }

  getEditable(): Class {
    return this.class;
  }

  setEditable(editable: Class) {
    this.class = editable;
  }

  isReference(): boolean {
    return this.class.definedBy.id.notEquals(this.model.id);
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
