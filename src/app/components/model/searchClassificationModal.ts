import { IPromise, IScope, ui } from 'angular';
import { Classification } from '../../entities/classification';
import { ClassificationService } from '../../services/classificationService';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { Exclusion } from '../../utils/exclusion';
import { WithId } from '../../types/entity';

export class SearchClassificationModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(exclude: Exclusion<WithId>): IPromise<Classification> {
    return this.$uibModal.open({
      template: require('./searchClassificationModal.html'),
      size: 'medium',
      resolve: {
        exclude: () => exclude
      },
      controller: SearchClassificationModalController,
      controllerAs: 'ctrl'
    }).result;
  }
}

class SearchClassificationModalController {

  classifications: Classification[];
  close = this.$uibModalInstance.dismiss;

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              classificationService: ClassificationService,
              exclude: Exclusion<WithId>) {

    classificationService.getClassifications()
      .then(classifications => this.classifications = classifications.filter(c => !exclude(c)));
  }

  get loading() {
    return this.classifications == null;
  }

  select(classification: Classification) {
    this.$uibModalInstance.close(classification);
  }
}
