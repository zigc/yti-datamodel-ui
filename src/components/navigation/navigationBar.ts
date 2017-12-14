import { module as mod } from './module';
import { LanguageService } from '../../services/languageService';
import { UserService } from '../../services/userService';
import { LoginModalService } from 'yti-common-ui/components/login-modal.component';
import { UILanguage } from '../../utils/language';
import { User } from '../../entities/user';
import { HelpSelectionModal } from '../common/helpSelectionModal';
import { InteractiveHelp } from '../../help/contract';
import { HelpProvider } from '../common/helpProvider';
import { IScope, ILocationService, route } from 'angular';
import { InteractiveHelpService } from '../../help/services/interactiveHelpService';
import { identity } from '../../utils/function';
import { modalCancelHandler } from '../../utils/angular';

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
    { code: 'sv' as UILanguage, name: 'På svenska (SV)' },
    { code: 'en' as UILanguage, name: 'In English (EN)' }
  ];

  helps: InteractiveHelp[];

  /* @ngInject */
  constructor($scope: IScope,
              $route: route.IRouteService,
              $location: ILocationService,
              private languageService: LanguageService,
              private userService: UserService,
              private loginModal: LoginModalService,
              private interactiveHelpService: InteractiveHelpService,
              private helpSelectionModal: HelpSelectionModal) {

    const helps = () => this.helpProvider && this.helpProvider.helps || [];

    $scope.$watchCollection(helps, h => {
      this.helps = h;

      if ($route.current && $route.current!.params.hasOwnProperty('help')) {
        this.startHelp().then(() => {}, _err => {
          $location.search('help', null as any);
        });
      }
    });
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
