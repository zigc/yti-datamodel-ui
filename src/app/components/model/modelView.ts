import { ILogService, IPromise } from 'angular';
import { EditableEntityController, EditableScope, Rights } from 'app/components/form/editableEntityController';
import { ModelService } from 'app/services/modelService';
import { UserService } from 'app/services/userService';
import { DeleteConfirmationModal } from 'app/components/common/deleteConfirmationModal';
import { module as mod } from './module';
import { ErrorModal } from 'app/components/form/errorModal';
import { Model } from 'app/entities/model';
import { LanguageContext } from 'app/types/language';
import { ModelControllerService } from './modelControllerService';
import { AuthorizationManagerService } from 'app/services/authorizationManagerService';

mod.directive('modelView', () => {
  return {
    scope: {
      model: '=',
      modelController: '='
    },
    restrict: 'E',
    template: require('./modelView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: ModelViewController
  };
});

export class ModelViewController extends EditableEntityController<Model> {

  visible = false;
  model: Model;
  modelController: ModelControllerService;

  /* @ngInject */
  constructor($scope: EditableScope,
              $log: ILogService,
              private modelService: ModelService,
              deleteConfirmationModal: DeleteConfirmationModal,
              errorModal: ErrorModal,
              userService: UserService,
              private authorizationManagerService: AuthorizationManagerService) {

    super($scope, $log, deleteConfirmationModal, errorModal, userService);

    if (this.modelController) {
      this.modelController.registerView(this);
    }

    $scope.$watch(() => this.isEditing(), editing => {
      if (editing) {
        this.visible = true;
      }
    });
  }

  create(model: Model) {
    return this.modelService.createModel(model);
  }

  update(model: Model, _oldEntity: Model) {
    return this.modelService.updateModel(model);
  }

  remove(model: Model): IPromise<any> {
    return this.modelService.deleteModel(model.id);
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
