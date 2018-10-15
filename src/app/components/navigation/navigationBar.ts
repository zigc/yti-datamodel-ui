import * as angular from 'angular';
import { ILocationService, IScope } from 'angular';
import { LanguageService } from 'app/services/languageService';
import { UserService } from 'app/services/userService';
import { LoginModalService } from 'yti-common-ui/components/login-modal.component';
import { UILanguage } from 'app/types/language';
import { User } from 'app/entities/user';
import { HelpSelectionModal } from 'app/components/common/helpSelectionModal';
import { InteractiveHelp } from 'app/help/contract';
import { HelpProvider } from 'app/components/common/helpProvider';
import { InteractiveHelpService } from 'app/help/services/interactiveHelpService';
import { identity } from 'yti-common-ui/utils/object';
import { LegacyComponent, modalCancelHandler } from 'app/utils/angular';
import { ImpersonationService } from 'app/services/impersonationService';
import { ConfigService } from 'app/services/configService';
import { Config } from 'app/entities/config';

const logo = require('../../../assets/logo.svg');

@LegacyComponent({
  bindings: {
    helpProvider: '<'
  },
  template: require('./navigationBar.html')
})
export class NavigationBarComponent {

  helpProvider: HelpProvider|null;

  logo = logo;

  availableLanguages = [
    { code: 'fi' as UILanguage, name: 'Suomeksi (FI)' },
    // { code: 'sv' as UILanguage, name: 'På svenska (SV)' },
    { code: 'en' as UILanguage, name: 'In English (EN)' }
  ];

  helps: InteractiveHelp[];

  fakeableUsers: { email: string, firstName: string, lastName: string }[] = [];
  config: Config;

  constructor($scope: IScope,
              $route: angular.route.IRouteService,
              $location: ILocationService,
              private languageService: LanguageService,
              private userService: UserService,
              impersonationService: ImpersonationService,
              private loginModal: LoginModalService,
              private interactiveHelpService: InteractiveHelpService,
              private helpSelectionModal: HelpSelectionModal,
              configService: ConfigService) {
    'ngInject';
    impersonationService.getFakeableUsers()
      .then(users => this.fakeableUsers = users);

    const helps = () => this.helpProvider && this.helpProvider.helps || [];

    $scope.$watchCollection(helps, h => {
      this.helps = h;

      if ($route.current && $route.current!.params.hasOwnProperty('help')) {
        this.startHelp().then(() => {}, _err => {
          $location.search('help', null as any);
        });
      }
    });

    configService.getConfig()
      .then(config => this.config = config);
  }

  get groupManagementUrl() {
    return this.config && this.config.groupManagementUrl;
  }

  get terminologyUrl() {
    return this.config && this.config.terminologyUrl;
  }

  get codeListUrl() {
    return this.config && this.config.codeListUrl;
  }

  fakeUser(userEmail: string) {
    this.userService.updateLoggedInUser(userEmail);
  }

  get language(): UILanguage {
    return this.languageService.UILanguage;
  }

  set language(language: UILanguage) {
    this.languageService.UILanguage = language;
  }

  get user(): User {
    return this.userService.user;
  }

  get noMenuItemsAvailable() {
    return !this.userService.isLoggedIn();
  }

  get environmentIdentifier() {
    return this.config ? this.config.env !== 'prod' ? ' - ' + this.config.env.toUpperCase() : '' : '';
  }

  isLoggedIn() {
    return !this.user.anonymous;
  }

  showGroupManagementLink() {
    return this.user.superuser || this.user.isInRoleInAnyOrganization('ADMIN');
  }

  logOut() {
    return this.userService.logout();
  }

  logIn() {
    this.loginModal.open();
  }

  canStartHelp() {
    return this.config && this.config.showIncompleteFeature && this.interactiveHelpService.isClosed() && this.helps.length > 0;
  }

  startHelp() {
    return this.helpSelectionModal.open(this.helps).then(identity, modalCancelHandler);
  }
}
