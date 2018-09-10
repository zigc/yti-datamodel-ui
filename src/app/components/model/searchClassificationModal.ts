import { IPromise, IScope } from 'angular';
import { Classification } from 'app/entities/classification';
import { ClassificationService } from 'app/services/classificationService';
import { IModalService, IModalServiceInstance } from 'angular-ui-bootstrap';
import { Exclusion } from 'app/utils/exclusion';
import { WithId } from 'app/types/entity';
import { comparingLocalizable } from 'app/utils/comparator';
import { LanguageService } from 'app/services/languageService';

export class SearchClassificationModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(exclude: Exclusion<WithId>): IPromise<Classification> {
    return this.$uibModal.open({
      template: require('./searchClassificationModal.html'),
      size: 'md',
      resolve: {
        exclude: () => exclude
      },
      controller: SearchClassificationModalController,
      controllerAs: '$ctrl'
    }).result;
  }
}

class SearchClassificationModalController {

  classifications: Classification[];

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              classificationService: ClassificationService,
              private languageService: LanguageService,
              exclude: Exclusion<WithId>) {

    classificationService.getClassifications()
      .then(classifications => {
        this.classifications = classifications.filter(c => !exclude(c));
        this.classifications.sort(comparingLocalizable<Classification>(this.languageService.createLocalizer(), c => c.label)); 
      });
  }

  get loading() {
    return this.classifications == null;
  }

  select(classification: Classification) {
    this.$uibModalInstance.close(classification);
  }

  close() {
    this.$uibModalInstance.dismiss('cancel');
  }
}
