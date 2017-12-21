import { ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import { Usage } from 'app/entities/usage';
import { LanguageContext } from 'app/types/language';
import { identity } from 'yti-common-ui/utils/object';
import { modalCancelHandler } from 'app/utils/angular';

interface UsageParameters {
  usage: Usage;
  context: LanguageContext;
}

export class ErrorModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(title: string, errorMessage: string, usage: UsageParameters|null) {
    this.$uibModal.open({
      template:
        `
          <modal-template purpose="danger">
          
            <modal-title>
              <i class="fa fa-exclamation-circle"></i>
              {{ctrl.title | translate}}
            </modal-title>
          
            <modal-body>
              <p>{{ctrl.errorMessage | translate}}</p>
              <usage ng-if="ctrl.usage" usage="ctrl.usage.usage" context="ctrl.usage.context"></usage>
            </modal-body>
          
            <modal-buttons>
              <button class="btn btn-link" type="button" ng-click="$dismiss('cancel')" translate>Close</button>
            </modal-buttons>
                      
          </modal-template>
        `,
      size: 'adapting',
      controllerAs: 'ctrl',
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
  /* @ngInject */
  constructor(public title: string, public errorMessage: string, public usage: UsageParameters|null) {
  }
}
