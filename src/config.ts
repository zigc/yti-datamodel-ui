
export interface Config {
  apiEndpoint: string;
  gitDate: string;
  gitHash: string;
  apiEndpointWithName(name: string): string;
}

class EnvironmentConfig implements Config {

  apiEndpointWithName(name: string) {
    return `${this.apiEndpoint}/rest/${name}`;
  }

  get apiEndpoint() {
    return process.env.API_ENDPOINT || '/api';
  }

  get gitDate() {
    return process.env.GIT_DATE;
  }

  get gitHash() {
    return process.env.GIT_HASH;
  }
}

export function defaultModelNamespace(prefix: string) {
    return `http://uri.suomi.fi/datamodel/ns/${prefix}`;
}

export const config: Config = new EnvironmentConfig();
