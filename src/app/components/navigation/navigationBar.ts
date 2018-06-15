import { module as mod } from './module';
import { LanguageService } from 'app/services/languageService';
import { UserService } from 'app/services/userService';
import { LoginModalService } from 'yti-common-ui/components/login-modal.component';
import { UILanguage } from 'app/types/language';
import { User } from 'app/entities/user';
import { HelpSelectionModal } from 'app/components/common/helpSelectionModal';
import { InteractiveHelp } from 'app/help/contract';
import { HelpProvider } from 'app/components/common/helpProvider';
import { IScope, ILocationService, route } from 'angular';
import { InteractiveHelpService } from 'app/help/services/interactiveHelpService';
import { identity } from 'yti-common-ui/utils/object';
import { modalCancelHandler } from 'app/utils/angular';
import { ImpersonationService } from '../../services/impersonationService';
import { ConfigService } from 'app/services/configService';

mod.directive('navigationBar', () => {
  return {
    restrict: 'E',
    template: require('./navigationBar.html'),
    scope: {
      helpProvider: '<'
    },
    bindToController: true,
    controllerAs: 'ctrl',
    controller: NavigationController
  };
});

class NavigationController {

  helpProvider: HelpProvider|null;

  availableLanguages = [
    { code: 'fi' as UILanguage, name: 'Suomeksi (FI)' },
    // { code: 'sv' as UILanguage, name: 'På svenska (SV)' },
    { code: 'en' as UILanguage, name: 'In English (EN)' }
  ];

  helps: InteractiveHelp[];

  fakeableUsers: { email: string, firstName: string, lastName: string }[] = [];
  groupManagementUrl: string;

  /* @ngInject */
  constructor($scope: IScope,
              $route: route.IRouteService,
              $location: ILocationService,
              private languageService: LanguageService,
              private userService: UserService,
              impersonationService: ImpersonationService,
              private loginModal: LoginModalService,
              private interactiveHelpService: InteractiveHelpService,
              private helpSelectionModal: HelpSelectionModal,
              configService: ConfigService) {

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
      .then(config => this.groupManagementUrl = config.groupsManagementUrl);
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
    return this.interactiveHelpService.isClosed() && this.helps.length > 0;
  }

  startHelp() {
    return this.helpSelectionModal.open(this.helps).then(identity, modalCancelHandler);
  }
}
