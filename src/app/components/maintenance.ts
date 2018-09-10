import { ILogService } from 'angular';
import { identity } from 'yti-common-ui/utils/object';
import { modalCancelHandler } from 'app/utils/angular';
import { IModalService } from 'angular-ui-bootstrap';

export class MaintenanceModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService, private $log: ILogService) {
  }

  open(err: any) {

    this.$log.debug(err);

    return this.$uibModal.open({
      template: require('./maintenance.html'),
      size: 'lg',
      backdrop: 'static'
    }).result.then(identity, modalCancelHandler);
  }
}
