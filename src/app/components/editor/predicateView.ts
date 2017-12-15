import { IAttributes, ILogService, IScope } from 'angular';
import { PredicateService } from '../../services/predicateService';
import { UserService } from '../../services/userService';
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import { Show } from '../../types/component';
import { ErrorModal } from '../form/errorModal';
import { module as mod } from './module';
import { setSelectionStyles } from '../../utils/angular';
import { Association, Attribute } from '../../entities/predicate';
import { Model } from '../../entities/model';
import { LanguageContext } from '../../types/language';
import { ModelControllerService } from '../model/modelControllerService';
import { AuthorizationManagerService } from '../../services/authorizationManagerService';

mod.directive('predicateView', () => {
  return {
    scope: {
      predicate: '=',
      model: '=',
      modelController: '=',
      show: '=',
      width: '='
    },
    restrict: 'E',
    template: require('./predicateView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: PredicateViewController,
    require: 'predicateView',
    link($scope: IScope, element: JQuery, _attributes: IAttributes, ctrl: PredicateViewController) {
      $scope.$watchGroup([() => ctrl.width, () => ctrl.show], ([selectionWidth, show]: [number, Show]) => {
        setSelectionStyles(element, show, selectionWidth);
      });
    }
  };
});

export class PredicateViewController extends EditableEntityController<Association|Attribute> {

  predicate: Association|Attribute;
  model: Model;
  modelController: ModelControllerService;
  show: Show;
  width: number;

  /* @ngInject */
  constructor($scope: EditableScope,
              $log: ILogService,
              deleteConfirmationModal: DeleteConfirmationModal,
              errorModal: ErrorModal,
              private predicateService: PredicateService,
              userService: UserService,
              private authorizationManagerService: AuthorizationManagerService) {
    super($scope, $log, deleteConfirmationModal, errorModal, userService);
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
