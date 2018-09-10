import { IHttpService, IPromise } from 'angular';
import { Config } from 'app/entities/config';
import { apiEndpointWithName } from './config';

interface ConfigType {
  groupsFrontend: string;
  conceptsFrontend: string;
  codesFrontend: string;
  dev: boolean;
}

export class ConfigService {

  /* @ngInject */
  constructor(private $http: IHttpService) {
  }

  getConfig(): IPromise<Config> {

    return this.$http.get<ConfigType>(apiEndpointWithName('config'))
      .then(response => {
        const data = response.data!;
        return new Config(data.groupsFrontend, data.conceptsFrontend, data.codesFrontend, data.dev);
      });
  }
}
