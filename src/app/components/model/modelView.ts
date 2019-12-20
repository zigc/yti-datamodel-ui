import { ILogService, IPromise, IQService } from 'angular';
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
import { AlertModalService } from 'yti-common-ui/components/alert-modal.component';
import { TranslateService } from '@ngx-translate/core';
import { changeToRestrictedStatus, Status } from 'yti-common-ui/entities/status';
import { DatamodelConfirmationModalService } from 'app/services/confirmation-modal.service';
import { ErrorModalService } from 'yti-common-ui/components/error-modal.component';

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
  statusChanged = false;
  changeResourceStatusesToo = false;
  statusResourcesTotal = 0;

  constructor($scope: EditableScope,
              $log: ILogService,
              private $q: IQService,
              private modelService: ModelService,
              deleteConfirmationModal: DeleteConfirmationModal,
              private datamodelConfirmationModalService: DatamodelConfirmationModalService,
              private errorModalService: ErrorModalService,
              errorModal: ErrorModal,
              userService: UserService,
              private authorizationManagerService: AuthorizationManagerService,
              private alertModalService: AlertModalService,
              private translateService: TranslateService) {
    'ngInject';
    super($scope, $log, deleteConfirmationModal, errorModal, userService);
  }

  $onInit() {
    this.parent.registerView(this);

    const editableStatus = () => this.editableInEdit ? this.editableInEdit.status : false;

    this.$scope.$watch(() => editableStatus(), newStatus => {
      this.statusChanged = newStatus && newStatus !== this.getEditable().status;

      if (!this.statusChanged) {
        this.changeResourceStatusesToo = false;
      }
    });

    this.$scope.$watch(() => this.model.status, newStatus => {
      this.modelService.getModelResourcesTotalCountByStatus(this.model, newStatus).then(resourcesTotal => {
        this.statusResourcesTotal = resourcesTotal;
      });
    });
  }

  $onDestroy() {
    this.parent.deregisterView(this);
  }

  create(model: Model) {
    return this.modelService.createModel(model);
  }

  update(model: Model, _oldEntity: Model) {
    const oldStatus = _oldEntity.status;
    const newStatus = model.status;

    const updateModel = () => {
      this.changeResourceStatusesToo = false;
      this.statusChanged = false;

      return this.modelService.updateModel(model).then(() => this.updated(model));
    };

    if (this.changeResourceStatusesToo) {
      return this.changeResourceStatuses(model, oldStatus, newStatus).then(() => {
        return updateModel();
      });
    } else {
      return updateModel();
    }
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

  changeResourceStatuses(model: Model, oldStatus: Status, newStatus: Status) {
    const modalRef = this.alertModalService.open('UPDATING_STATUSES_MESSAGE');

    return this.modelService.changeStatuses(model, oldStatus, newStatus).then(result => {
      if (this.statusResourcesTotal === 0) {
        modalRef.message = this.translateService.instant('No resources were found with the starting status. No changes to resources statuses.');
      } else if (this.statusResourcesTotal === 1) {
        modalRef.message = this.translateService.instant('Status changed to one resource.');
      } else {
        const messagePart1 = this.translateService.instant('Status changed to ');
        const messagePart2 = this.translateService.instant(' resources.');

        modalRef.message = messagePart1 + this.statusResourcesTotal + messagePart2;
      }

      modalRef.showOkButton = true;
    }, error => {
      this.errorModalService.openSubmitError(error);
      modalRef.cancel();
    });
  }

  confirmChangeToRestrictedStatusDialog(model: Model, _oldEntity: Model): IPromise<any> | null {
    return changeToRestrictedStatus(_oldEntity.status, model.status) ? this.$q.when(this.datamodelConfirmationModalService.openChangeToRestrictedStatus()) : null;
  }

  confirmDialog(model: Model, _oldEntity: Model): IPromise<any> | null {

    const startStatusLocalized: string = this.translateService.instant(model.status);
    const endStatusLocalized: string = this.translateService.instant(_oldEntity.status);

    return this.changeResourceStatusesToo ? this.$q.when(this.datamodelConfirmationModalService.openChangeResourceStatusesAlsoAlongWithTheDatamodelStatus(startStatusLocalized, endStatusLocalized)) : null;
  }
}
