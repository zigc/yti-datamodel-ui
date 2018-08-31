import { IHttpService, IPromise } from 'angular';
import { config } from 'config';
import { Config } from '../entities/config';

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

    return this.$http.get<ConfigType>(config.apiEndpointWithName('config'))
      .then(response => {
        const data = response.data!;
        return new Config(data.groupsFrontend, data.conceptsFrontend, data.codesFrontend, data.dev);
      });
  }
}
