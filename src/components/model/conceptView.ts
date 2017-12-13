import { ILogService, IQService } from 'angular';
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { UserService } from '../../services/userService';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import { module as mod } from './module';
import { ConceptEditorModalController } from './conceptEditorModal';
import { UsageService } from '../../services/usageService';
import { ErrorModal } from '../form/errorModal';
import { Concept, LegacyConcept } from '../../entities/vocabulary';
import { Model } from '../../entities/model';
import { Usage } from '../../entities/usage';
import { GroupListItem } from '../../entities/group';
import { LanguageContext } from '../../entities/contract';

mod.directive('conceptView', () => {
  return {
    scope: {
      concept: '=',
      model: '=',
      modelController: '='
    },
    restrict: 'E',
    template: require('./conceptView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: ConceptViewController
  };
});

// XXX: Not editable for now, might change in future
export class ConceptViewController extends EditableEntityController<Concept|LegacyConcept> {

  concept: Concept|null;
  model: Model;
  modelController: ConceptEditorModalController;
  usage: Usage|null = null;
  loading = true;

  /* @ngInject */
  constructor($scope: EditableScope,
              private $q: IQService,
              $log: ILogService,
              deleteConfirmationModal: DeleteConfirmationModal,
              errorModal: ErrorModal,
              userService: UserService,
              usageService: UsageService) {
    super($scope, $log, deleteConfirmationModal, errorModal, userService);

    this.modelController.registerView(this);

    $scope.$watch(() => this.concept, concept => {
      this.loading = true;
      if (concept) {
        usageService.getUsage(concept).then(usage => {
          this.usage = usage;
          this.loading = false;
        });
      } else {
        this.usage = null;
      }
    });
  }

  create(_entity: Concept) {
    return this.$q.reject('Concept creation is not implemented');
  }

  update(_entity: Concept, _oldEntity: Concept) {
    return this.$q.reject('Concept update is not implemented');
  }

  remove(_entity: Concept) {
    return this.$q.reject('Concept remove is not implemented');
  }

  rights(): Rights {
    return {
      edit: () => false,
      remove: () => false
    };
  }

  getGroup(): GroupListItem {
    return this.model.group;
  }

  getEditable(): Concept|null {
    return this.concept;
  }

  setEditable(editable: Concept) {
    this.concept = editable;
  }

  getContext(): LanguageContext {
    return this.model;
  }
}
