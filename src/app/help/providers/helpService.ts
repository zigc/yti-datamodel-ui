import { HelpProvider } from '../../components/common/helpProvider';
import { BehaviorSubject } from 'rxjs';

export class HelpService {

  helpProvider: BehaviorSubject<HelpProvider | undefined> = new BehaviorSubject(undefined);

  registerProvider(helpProvider: HelpProvider) {
    if (this.helpProvider.value) {
      console.error('Registering new help provider before unregistering the previous one');
    }
    this.helpProvider.next(helpProvider);
  }

  unregisterProvider(helpProvider: HelpProvider) {
    if (this.helpProvider.value === helpProvider) {
      this.helpProvider.next(undefined);
    } else {
      console.error('Unregistering unknown help provider, ignoring request')
    }
  }
}
