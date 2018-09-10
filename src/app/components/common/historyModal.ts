import { IPromise } from 'angular';
import { IModalService } from 'angular-ui-bootstrap';
import { ClassService } from 'app/services/classService';
import { PredicateService } from 'app/services/predicateService';
import { ModelService } from 'app/services/modelService';
import { HistoryService } from 'app/services/historyService';
import { UserService } from 'app/services/userService';
import { Uri } from 'app/entities/uri';
import { comparingDate } from 'app/utils/comparator';
import { reversed } from 'yti-common-ui/utils/comparator';
import { containsAny } from 'yti-common-ui/utils/array';
import { Model } from 'app/entities/model';
import { Class } from 'app/entities/class';
import { Predicate } from 'app/entities/predicate';
import { Entity } from 'app/entities/version';
import { identity } from 'yti-common-ui/utils/object';
import { modalCancelHandler } from 'app/utils/angular';

export class HistoryModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(model: Model, resource: Class|Predicate|Model) {
    this.$uibModal.open({
      template: require('./historyModal.html'),
      size: resource instanceof Model ? 'lg' : 'md',
      controllerAs: '$ctrl',
      controller: HistoryModalController,
      resolve: {
        model: () => model,
        resource: () => resource
      }
    }).result.then(identity, modalCancelHandler);
  }
}

class HistoryModalController {

  versions: Entity[];
  selectedItem: Entity;
  selection: Class|Predicate|Model;
  showAuthor: boolean;
  loading: boolean;

  /* @ngInject */
  constructor(historyService: HistoryService,
              private classService: ClassService,
              private predicateService: PredicateService,
              private modelService: ModelService,
              userService: UserService,
              public model: Model,
              public resource: Class|Predicate|Model) {

    this.showAuthor = userService.isLoggedIn();

    historyService.getHistory(resource.id).then(activity => {
      this.versions = activity.versions.sort(reversed(comparingDate<Entity>(version => version.createdAt)));
    });
  }

  isLoading(item: Entity) {
    return item === this.selectedItem && this.loading;
  }

  isSelected(item: Entity) {
    return this.selectedItem === item;
  }

  select(entity: Entity) {
    this.selectedItem = entity;
    this.loading = true;
    this.fetchResourceAtVersion(entity.id).then(resource => {
      this.selection = resource;
      this.loading = false;
    });
  }

  private fetchResourceAtVersion(versionId: Uri): IPromise<Class|Predicate|Model> {
    if (containsAny(this.resource.type, ['class', 'shape'])) {
      return this.classService.getClass(versionId, this.model);
    } else if (containsAny(this.resource.type, ['attribute', 'association'])) {
      return this.predicateService.getPredicate(versionId);
    } else if (containsAny(this.resource.type, ['model', 'profile', 'library'])) {
      return this.modelService.getModelByUrn(versionId);
    } else {
      throw new Error('Unsupported type: ' + this.resource.type);
    }
  }
}
