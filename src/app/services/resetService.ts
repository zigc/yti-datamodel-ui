import { IHttpService, IPromise } from 'angular';
import { apiEndpointWithName } from './config';

export class ResetService {

  /* @ngInject */
  constructor(private $http: IHttpService) {
  }

  reset(): IPromise<any> {
    return this.$http.get(apiEndpointWithName('reset'));
  }
}
