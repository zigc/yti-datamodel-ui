import { User } from 'app/entities/user';
import { Observable } from 'rxjs';

export interface UserService {
  user: User;
  loggedIn$: Observable<boolean>;
  updateLoggedInUser(fakeLoginMail?: string): void;
  isLoggedIn(): boolean;
  register(): void;
  login(): void;
  logout(): void;
}
