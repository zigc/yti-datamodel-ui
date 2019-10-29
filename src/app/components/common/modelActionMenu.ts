import { IScope, IWindowService } from 'angular';
import { LanguageService } from 'app/services/languageService';
import { LanguageContext } from 'app/types/language';
import { LegacyComponent } from 'app/utils/angular';
import { Model } from '../../entities/model';
import { MessagingService } from '../../services/messaging-service';
import { ConfirmationModalService } from 'yti-common-ui/components/confirmation-modal.component';
import { ignoreModalClose } from 'yti-common-ui/utils/modal';
import { ErrorModal } from '../form/errorModal';
import { Config } from '../../entities/config';

@LegacyComponent({
  bindings: {
    isMessagingEnabled: '<',
    isAnonymous: '<',
    hasSubscription: '<',
    entity: '<',
    context: '<'
  },
  template: require('./modelActionMenu.html')
})
export class ModelActionMenuComponent {

  entity: Model;
  context: LanguageContext;
  hasSubscription: boolean;
  isMessagingEnabled: boolean;
  isLoggedIn: boolean;
  uri: string;
  config: Config;

  constructor(private $scope: IScope,
              private $window: IWindowService,
              private languageService: LanguageService,
              private confirmationModalService: ConfirmationModalService,
              private messagingService: MessagingService,
              private errorModal: ErrorModal) {
    'ngInject';
  }

  $onInit() {

    this.uri = this.entity.namespace.toString();
  }

  get showMenu(): boolean {

    return this.canSubscribe;
  }

  get canSubscribe(): boolean {

    return this.isMessagingEnabled && !this.isLoggedIn;
  }

  get canAddSubscription(): boolean {

    return this.canSubscribe && !this.hasSubscription;
  }

  get canRemoveSubscription(): boolean {

    return this.canSubscribe && this.hasSubscription;
  }


  addSubscription() {

    const uri = this.entity.namespace.toString();
    const type = this.entity.normalizedType;
    if (uri) {
      this.confirmationModalService.open('ADD EMAIL SUBSCRIPTION TO RESOURCE REGARDING CHANGES?', undefined, '')
        .then(() => {
          this.messagingService.addSubscription(uri, type).subscribe(success => {
            if (success) {
              this.hasSubscription = true;
            } else {
              this.hasSubscription = false;
              this.errorModal.openSubmitError('Adding subscription failed.');
            }
          });
        }, ignoreModalClose);
    }
  }

  removeSubscription() {

    const uri = this.entity.namespace.toString();
    if (uri) {
      this.confirmationModalService.open('REMOVE EMAIL SUBSCRIPTION TO RESOURCE?', undefined, '')
        .then(() => {
          this.messagingService.deleteSubscription(uri).subscribe(success => {
            if (success) {
              this.hasSubscription = false;
            } else {
              this.hasSubscription = true;
              this.errorModal.openSubmitError('Subscription deletion failed.');
            }
          });
        }, ignoreModalClose);
    }
  }

}