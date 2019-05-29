import { IPromise } from 'angular';
import { IModalService } from 'angular-ui-bootstrap';
import { Model } from '../../entities/model';
import { Predicate } from '../../entities/predicate';

export class ShowPredicateInfoModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  open(model: Model, selection: Predicate): IPromise<void> {
    return this.$uibModal.open({
      template: require('./showPredicateInfoModal.html'),
      size: 'lg',
      controllerAs: '$ctrl',
      controller: ShowPredicateInfoModalController,
      backdrop: true,
      resolve: {
        model: () => model,
        selection: () => selection
      }
    }).result;
  }
};

class ShowPredicateInfoModalController {
  
  constructor(public model: Model,
              public selection: Predicate) {
    'ngInject';
  }
}
