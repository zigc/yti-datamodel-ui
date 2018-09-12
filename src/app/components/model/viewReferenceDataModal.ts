import { IModalService } from 'angular-ui-bootstrap';
import { ReferenceData } from 'app/entities/referenceData';
import { LanguageContext } from 'app/types/language';
import { identity } from 'yti-common-ui/utils/object';
import { modalCancelHandler } from 'app/utils/angular';

export class ViewReferenceDataModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  open(referenceData: ReferenceData, context: LanguageContext) {
    this.$uibModal.open({
      template: `
        <form class="view-reference-data">
          <modal-template>
            <modal-title translate>Reference data information</modal-title>
            
            <modal-body class="full-height">
              <div class="row">
                <div class="col-md-12">
                  <reference-data-view reference-data="$ctrl.referenceData" context="$ctrl.context" class="popup" show-codes="true"></reference-data-view>
                </div>
              </div>
            </modal-body>
            
            <modal-buttons>
              <button class="btn btn-link" type="button" ng-click="$dismiss('cancel')" translate>Close</button>
            </modal-buttons>
          </modal-template>
        </form>
      `,
      size: 'md',
      controller: ViewReferenceDataModalController,
      controllerAs: '$ctrl',
      backdrop: true,
      resolve: {
        referenceData: () => referenceData,
        context: () => context
      }
    }).result.then(identity, modalCancelHandler);
  }
}

export class ViewReferenceDataModalController {

  constructor(public referenceData: ReferenceData, public context: LanguageContext) {
    'ngInject';
  }
}
