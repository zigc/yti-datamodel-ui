import { IHttpService, IPromise } from 'angular';
import { Config } from 'app/entities/config';
import { apiEndpointWithName } from './config';

interface ConfigType {
  groupsFrontend: string;
  conceptsFrontend: string;
  codesFrontend: string;
  dev: boolean;
  env: string;
}

export class ConfigService {

  constructor(private $http: IHttpService) {
    'ngInject';
  }

  getConfig(): IPromise<Config> {

    return this.$http.get<ConfigType>(apiEndpointWithName('config'))
      .then(response => {
        const data = response.data!;
        return new Config(data.groupsFrontend, data.conceptsFrontend, data.codesFrontend, data.dev, data.env);
      });
  }
}
