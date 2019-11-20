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
import { Url } from '../../entities/uri';
import { UserService } from '../../services/userService';
import { MassMigrateDatamodelResourceStatusesModalService } from 'app/components/model/mass-migrate-datamodel-resource-statuses-modal.component';

@LegacyComponent({
  bindings: {
    isMessagingEnabled: '<',
    hasSubscription: '<',
    changeHasSubscription: '&',
    entity: '<',
    context: '<',
    editing: '<'
  },
  template: require('./modelActionMenu.html')
})
export class ModelActionMenuComponent {

  entity: Model;
  context: LanguageContext;
  editing: boolean;
  hasSubscription: boolean;
  isMessagingEnabled: boolean;
  uri: string;
  config: Config;
  changeHasSubscription: (enabled: boolean) => void;

  constructor(private $scope: IScope,
              private $window: IWindowService,
              private languageService: LanguageService,
              private confirmationModalService: ConfirmationModalService,
              private messagingService: MessagingService,
              private errorModal: ErrorModal,
              private userService: UserService,
              private massMigrateDatamodelResourceStatusesModalService: MassMigrateDatamodelResourceStatusesModalService) {
    'ngInject';
  }

  $onInit() {

    this.uri = this.entity.namespace.toString();
  }

  get showMenu(): boolean {

    return this.canSubscribe;
  }

  get canSubscribe(): boolean {

    return this.isMessagingEnabled && this.userService.isLoggedIn();
  }

  get canAddSubscription(): boolean {

    return this.canSubscribe && !this.hasSubscription;
  }

  get canRemoveSubscription(): boolean {

    return this.canSubscribe && this.hasSubscription;
  }


  addSubscription() {

    const uri: string = this.stripHashTagFromEndOfUrl(this.entity.namespace);
    const type = this.entity.normalizedType;
    if (uri && type) {
      this.confirmationModalService.open('ADD EMAIL SUBSCRIPTION TO RESOURCE REGARDING CHANGES?', undefined, '')
        .then(() => {
          this.messagingService.addSubscription(uri, type).subscribe(success => {
            if (success) {
              this.changeHasSubscription(true);
            } else {
              this.changeHasSubscription(false);
              this.errorModal.openSubmitError('Adding subscription failed.');
            }
          });
        }, ignoreModalClose);
    }
  }

  removeSubscription() {

    const uri: string = this.stripHashTagFromEndOfUrl(this.entity.namespace);
    if (uri) {
      this.confirmationModalService.open('REMOVE EMAIL SUBSCRIPTION TO RESOURCE?', undefined, '')
        .then(() => {
          this.messagingService.deleteSubscription(uri).subscribe(success => {
            if (success) {
              this.changeHasSubscription(false);
            } else {
              this.changeHasSubscription(true);
              this.errorModal.openSubmitError('Subscription deletion failed.');
            }
          });
        }, ignoreModalClose);
    }
  }

  stripHashTagFromEndOfUrl(url: Url): string {

    const uri = url.toString();

    if (uri.endsWith('#')) {
      return uri.substr(0, uri.length - 1);
    }
    return uri.toString();
  }

  massMigrateDatamodelStatuses() {
    this.massMigrateDatamodelResourceStatusesModalService.open(this.entity);
  }
}
