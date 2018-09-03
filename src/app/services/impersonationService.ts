import { IHttpService } from 'angular';
import { config } from 'config';

export class ImpersonationService {

  /* @ngInject */
  constructor(private $http: IHttpService) {
  }

  getFakeableUsers() {
    return this.$http.get<{ email: string, firstName: string, lastName: string }[]>(config.apiEndpointWithName('fakeableUsers'))
      .then(result => result.data!);
  }
}
