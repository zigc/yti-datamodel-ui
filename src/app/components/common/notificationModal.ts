import { IPromise, ILocationService } from 'angular';
import { IModalService } from 'angular-ui-bootstrap';
import { Model } from 'app/entities/model';
import { identity } from 'yti-common-ui/utils/object';
import { modalCancelHandler } from 'app/utils/angular';

export class NotificationModal {

  constructor(private $uibModal: IModalService, private $location: ILocationService) {
    'ngInject';
  }

  private open(title: string, body: string): IPromise<any> {
    const modal = this.$uibModal.open({
      template: `
        <div class="modal-header modal-header-warning">
          <h4 class="modal-title">
            <a><i ng-click="$dismiss('cancel')" class="fas fa-times"></i></a>
            <span translate>${title}</span>
          </h4>
        </div>
        
        <div class="modal-body">
          <span translate>${body}</span>
        </div>

        <div class="modal-footer">
          <button class="btn btn-link" type="button" ng-click="$close('cancel')" translate>Close</button>
        </div>
        `,
      size: 'adapting'
    });

    return modal.result.then(() => true, _err => true);
  }

  openNotLoggedIn() {
    this.open('Session expired', 'Please login to perform the action').then(identity, modalCancelHandler);
  }

  openModelNotFound() {
    this.open('Model not found', 'You will be redirected to the front page').then(() => this.$location.url('/'), modalCancelHandler);
  }

  openPageNotFound() {
    this.open('Page not found', 'You will be redirected to the front page').then(() => this.$location.url('/'), modalCancelHandler);
  }

  openResourceNotFound(model: Model) {
    return this.open('Resource not found', 'You will be redirected to the model').then(() => this.$location.url(model.iowUrl()), modalCancelHandler);
  }
}
