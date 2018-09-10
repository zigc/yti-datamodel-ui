import { IHttpService } from 'angular';
import { apiEndpointWithName } from './config';

export class ImpersonationService {

  /* @ngInject */
  constructor(private $http: IHttpService) {
  }

  getFakeableUsers() {
    return this.$http.get<{ email: string, firstName: string, lastName: string }[]>(apiEndpointWithName('fakeableUsers'))
      .then(result => result.data!);
  }
}
