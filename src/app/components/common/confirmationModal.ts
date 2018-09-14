import { IPromise } from 'angular';
import { IModalService } from 'angular-ui-bootstrap';

export class ConfirmationModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  private open(title: string, body: string, additionalCssClass?: string): IPromise<void> {
    return this.$uibModal.open({
      template: `
        <div class="confirmation">

          <div class="modal-header modal-header-warning">
            <h4 class="modal-title">
              <a><i ng-click="$dismiss('cancel')" class="fas fa-times"></i></a>
              {{$ctrl.title | translate}}
            </h4>
          </div>
          
          <div class="modal-body">
            {{$ctrl.body | translate}}
          </div>
          
          <div class="modal-footer">
            <button id="confirm_modal_template_button" class="btn btn-action confirm" type="button" ng-click="$close()" translate>Yes</button>
            <button id="cancel_modal_template_button" class="btn btn-link" type="button" ng-click="$dismiss('cancel')" translate>Cancel</button>
          </div>

       </div>
      `,
      controllerAs: '$ctrl',
      controller: ConfirmationModalController,
      windowClass: additionalCssClass,
      resolve: {
        title: () => title,
        body: () => body
      }
    }).result;
  }

  openEditInProgress() {
    return this.open('Edit in progress', 'Are you sure that you want to continue? By continuing unsaved changes will be lost.');
  }

  openCloseModal() {
    return this.open('Dialog is open', 'Are you sure that you want to close dialog?');
  }

  openCloseHelp() {
    return this.open('Help is open', 'Are you sure that you want to close help?', 'over-help');
  }

  openVisualizationLocationsSave() {
    return this.open('Save visualization position', 'Are you sure you want to save? Saving overrides previously saves positions.');
  }
}

class ConfirmationModalController {
  constructor(public title: string, public body: string) {
    'ngInject';
  }
}
