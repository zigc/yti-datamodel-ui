import { IModalService } from 'angular-ui-bootstrap';
import { Usage } from 'app/entities/usage';
import { LanguageContext } from 'app/types/language';
import { identity } from 'yti-common-ui/utils/object';
import { modalCancelHandler } from 'app/utils/angular';

interface UsageParameters {
  usage: Usage;
  context: LanguageContext;
}

export class ErrorModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  private open(title: string, errorMessage: string, usage: UsageParameters|null) {
    this.$uibModal.open({
      template:
        `
          <div class="modal-header modal-header-danger">
            <h4 class="modal-title">
              <a><i ng-click="$dismiss('cancel')" class="fas fa-times"></i></a>
              <i class="fas fa-exclamation-circle"></i>{{$ctrl.title | translate}}
            </h4>
          </div>          
          
          <div class="modal-body">
            <p>{{$ctrl.errorMessage | translate}}</p>
            <usage ng-if="$ctrl.usage" usage="$ctrl.usage.usage" context="$ctrl.usage.context"></usage>
          </div>
        
          <div class="modal-footer">
            <button class="btn btn-link" type="button" ng-click="$dismiss('cancel')" translate>Close</button>
          </div>
      `,
      size: 'adapting',
      controllerAs: '$ctrl',
      controller: ErrorModalController,
      resolve: {
        title: () => title,
        errorMessage: () => errorMessage,
        usage: () => usage
      }
    }).result.then(identity, modalCancelHandler);
  }

  openSubmitError(errorMessage: string) {
    this.open('Submit error', errorMessage, null);
  }

  openUsageError(title: string, errorMessage: string, usage: Usage, context: LanguageContext) {
    this.open(title, errorMessage, { usage, context });
  }
}

class ErrorModalController {
  constructor(public title: string, public errorMessage: string, public usage: UsageParameters|null) {
    'ngInject';
  }
}
