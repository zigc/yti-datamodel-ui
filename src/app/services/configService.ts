import { IHttpService, IPromise } from 'angular';
import { config } from 'config';
import { UrlConfig } from '../entities/urlConfig';

export class ConfigService {

  /* @ngInject */
  constructor(private $http: IHttpService) {
  }

  getUrlConfig(): IPromise<UrlConfig> {

    return this.$http.get<{ groups: string, concepts: string }>(config.apiEndpointWithName('config'))
      .then(response => new UrlConfig(response.data!.groups, response.data!.concepts));
  }
}
