import { IPromise } from 'angular';
import { IModalService } from 'angular-ui-bootstrap';
import { KnownPredicateType } from 'app/types/entity';

export class ChoosePredicateTypeModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(): IPromise<KnownPredicateType> {
    return this.$uibModal.open({
      template: require('./choosePredicateTypeModal.html'),
      size: 'adapting',
      controllerAs: '$ctrl',
      controller: ChoosePredicateTypeModalController
    }).result;
  }
};

export class ChoosePredicateTypeModalController {
  type: KnownPredicateType = 'attribute';
}
