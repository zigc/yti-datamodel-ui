import { IPromise } from 'angular';
import { IModalService } from 'angular-ui-bootstrap';
import { Class } from '../../entities/class';
import { Model } from '../../entities/model';
import { ExternalEntity } from '../../entities/externalEntity';

export class ShowClassInfoModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  open(model: Model, selection: Class | ExternalEntity, isSelectionExternalEntity: boolean): IPromise<void> {
    return this.$uibModal.open({
      template: require('./showClassInfoModal.html'),
      size: 'lg',
      controllerAs: '$ctrl',
      controller: ShowClassInfoModalController,
      backdrop: true,
      resolve: {
        model: () => model,
        selection: () => selection,
        isSelectionExternalEntity: () => isSelectionExternalEntity
      }
    }).result;
  }
};

class ShowClassInfoModalController {
  
  constructor(public model: Model,
              public selection: Class | ExternalEntity,
              public isSelectionExternalEntity: boolean) {
    'ngInject';
  }
}
