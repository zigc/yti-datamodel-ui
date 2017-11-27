import { IPromise, IHttpService, IQService } from 'angular';
import { config } from '../../config';
import { User, DefaultUser, AnonymousUser } from '../entities/user';

export interface UserService {
  user: User;
  updateLogin(): IPromise<User>;
  ifStillLoggedIn(loggedInCallback: () => void, notLoggedInCallback: () => void): void;
  isLoggedIn(): boolean;
  logout(): IPromise<User>;
}

export class DefaultUserService {

  user: User = new AnonymousUser();

  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService) {
  }

  updateLogin(): IPromise<User> {
    return this.$http.get<boolean>(config.apiEndpointWithName('loginstatus'))
      .then(statusResponse => {
        const loggedIn: boolean = statusResponse.data || false;

        if (loggedIn) {
          return this.$http.get<any>(config.apiEndpointWithName('user'))
            .then(response => this.user = new DefaultUser(response.data!) as User);
        } else {
          return this.$q.when(new AnonymousUser() as User);
        }
      })
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

  logout(): IPromise<User> {
    return this.$http.get(config.apiEndpointWithName('logout')).then(() => this.user = new AnonymousUser());
  }
}
