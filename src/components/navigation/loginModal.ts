import { ILocationService, IWindowService, ui } from 'angular';
import { modalCancelHandler } from '../../utils/angular';
import { identity } from '../../utils/function';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;

export class LoginModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open() {
    this.$uibModal.open({
      template: require('./loginModal.html'),
      controller: LoginModalController,
      controllerAs: 'ctrl'
    }).result.then(identity, modalCancelHandler);
  }
}

class LoginModalController {
  /* @ngInject */
  constructor(private $location: ILocationService, private $window: IWindowService, private $uibModalInstance: IModalServiceInstance) {
  }

  close = () => this.$uibModalInstance.dismiss('cancel');

  login() {
    this.$window.location.href = `/Shibboleth.sso/Login?target=${encodeURIComponent(this.$location.absUrl())}`;
  }

  register() {
    this.$window.location.href = 'http://id.eduuni.fi/signup';
  }
}
