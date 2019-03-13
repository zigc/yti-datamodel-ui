import { ILogService, IPromise } from 'angular';
import { EditableEntityController, EditableScope, Rights } from 'app/components/form/editableEntityController';
import { ModelService } from 'app/services/modelService';
import { UserService } from 'app/services/userService';
import { DeleteConfirmationModal } from 'app/components/common/deleteConfirmationModal';
import { ErrorModal } from 'app/components/form/errorModal';
import { Model } from 'app/entities/model';
import { LanguageContext } from 'app/types/language';
import { EditorContainer } from './modelControllerService';
import { AuthorizationManagerService } from 'app/services/authorizationManagerService';
import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    id: '<',
    model: '<',
    parent: '<',
    deleted: '&',
    updated: '&',
    namespacesInUse: '<'
  },
  template: require('./modelView.html')
})
export class ModelViewComponent extends EditableEntityController<Model> {

  model: Model;
  parent: EditorContainer;
  deleted: (model: Model) => void;
  updated: (model: Model) => void;
  namespacesInUse: Set<string>;

  constructor($scope: EditableScope,
              $log: ILogService,
              private modelService: ModelService,
              deleteConfirmationModal: DeleteConfirmationModal,
              errorModal: ErrorModal,
              userService: UserService,
              private authorizationManagerService: AuthorizationManagerService) {
    'ngInject';
    super($scope, $log, deleteConfirmationModal, errorModal, userService);
  }

  $onInit() {
    this.parent.registerView(this);
  }

  $onDestroy() {
    this.parent.deregisterView(this);
  }

  create(model: Model) {
    return this.modelService.createModel(model);
  }

  update(model: Model, _oldEntity: Model) {
    return this.modelService.updateModel(model).then(() => this.updated(model));
  }

  remove(model: Model): IPromise<any> {
    return this.modelService.deleteModel(model.id).then(() => this.deleted(model));
  }

  rights(): Rights {
    return {
      edit: () => this.authorizationManagerService.canEditModel(this.model),
      remove: () => this.authorizationManagerService.canRemoveModel(this.model)
    };
  }

  getEditable(): Model {
    return this.model;
  }

  setEditable(editable: Model) {
    this.model = editable;
  }

  getContext(): LanguageContext {
    return this.model;
  }
}
