import { IPromise } from 'angular';
import { IModalService, IModalServiceInstance } from 'angular-ui-bootstrap';
import { PredicateService } from 'app/services/predicateService';
import { Uri } from 'app/entities/uri';
import { Predicate } from 'app/entities/predicate';
import { Model } from 'app/entities/model';

export class CopyPredicateModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  open(predicate: Predicate|Uri, type: 'attribute' | 'association', model: Model): IPromise<Predicate> {
    return this.$uibModal.open({
      template: `
        <form name="form">
          
            <div class="modal-header">
              <h4 class="modal-title">
                <a><i ng-click="$dismiss('cancel')" class="fas fa-times"></i></a>
                {{'Copy' | translate}} {{$ctrl.predicate.type | translate}}
              </h4>
            </div>
                     
            <div class="modal-body">
              <div class="row">
                <div class="col-md-12">
                  <model-language-chooser class="pull-right" context="$ctrl.model"></model-language-chooser>
                </div>
              </div>
              <div class="row">
                <div class="col-md-12">
                  <predicate-form id="'copy_predicate'" predicate="$ctrl.predicate" old-predicate="$ctrl.predicate" model="$ctrl.model"></predicate-form>
                </div>
              </div>
            </div>
          
            <div class="modal-footer">
              <button type="button"
                      class="btn btn-action confirm"
                      ng-click="$ctrl.confirm()"
                      ng-disabled="form.$invalid || form.$pending || !ctrl.predicate.subject">{{'Copy' | translate}}
              </button>
              
              <button class="btn btn-link" type="button" ng-click="$dismiss('cancel')" translate>Cancel</button>
            </div>

        </form>
      `,
      size: 'md',
      controllerAs: '$ctrl',
      resolve: {
        predicate: () => predicate,
        type: () => type,
        model: () => model
      },
      controller: CopyPredicateModalController
    }).result;
  }
}

export class CopyPredicateModalController {

  predicate: Predicate;

  constructor(private $uibModalInstance: IModalServiceInstance,
              predicateService: PredicateService,
              predicate: Predicate|Uri,
              type: 'attribute' | 'association',
              public model: Model) {
    'ngInject';
    predicateService.copyPredicate(predicate, type, model).then(copied => this.predicate = copied);
  }

  confirm() {
    this.$uibModalInstance.close(this.predicate);
  }
}
