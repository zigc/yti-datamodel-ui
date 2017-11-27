import { IPromise, IHttpService, IWindowService, ILocationService } from 'angular';
import { config } from '../../config';
import { User, DefaultUser } from '../entities/user';

export interface UserService {
  user: User;
  updateLogin(): IPromise<User>;
  ifStillLoggedIn(loggedInCallback: () => void, notLoggedInCallback: () => void): void;
  isLoggedIn(): boolean;
  logout(): IPromise<User>;
}

export class DefaultUserService {

  user: User;

  /* @ngInject */
  constructor(private $http: IHttpService,
              private $window: IWindowService,
              private $location: ILocationService) {
  }

  updateLogin(): IPromise<User> {
    return this.$http.get<any>(config.apiEndpointWithName('user'))
      .then(response => this.user = new DefaultUser(response.data!))
      .then(updatedUser => this.user = updatedUser);
  }

  ifStillLoggedIn(loggedInCallback: () => void, notLoggedInCallback: () => void): void {
    this.updateLogin().then(user => {
      if (user.isLoggedIn()) {
        loggedInCallback();
      } else {
        notLoggedInCallback();
      }
    });
  }

  isLoggedIn(): boolean {
    return this.user.isLoggedIn();
  }

  logout() {
    this.$window.location.href = `/Shibboleth.sso/Logout?return=${encodeURIComponent(this.$location.absUrl())}`;
  }
}
