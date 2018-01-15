import { IHttpService, IPromise } from 'angular';
import { config } from 'config';

export class ImpersonationService {

  /* @ngInject */
  constructor(private $http: IHttpService) {
  }

  getFakeableUsers(): IPromise<{ email: string, firstName: string, lastName: string }[]> {
    return this.$http.get(config.apiEndpointWithName('fakeableUsers'))
      .then(result => result.data!);
  }
}
