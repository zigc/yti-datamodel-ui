import { IHttpService, IPromise } from 'angular';
import { config } from 'config';
import { Config } from '../entities/config';

export class ConfigService {

  /* @ngInject */
  constructor(private $http: IHttpService) {
  }

  getConfig(): IPromise<Config> {

    return this.$http.get<{ groups: string, concepts: string }>(config.apiEndpointWithName('config'))
      .then(response => new Config(response.data!.groups, response.data!.concepts));
  }
}
