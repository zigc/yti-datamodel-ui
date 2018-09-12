import { IHttpService, IPromise } from 'angular';
import { apiEndpointWithName } from './config';

export class ResetService {

  constructor(private $http: IHttpService) {
    'ngInject';
  }

  reset(): IPromise<any> {
    return this.$http.get(apiEndpointWithName('reset'));
  }
}
