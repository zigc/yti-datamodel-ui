import { IPromise, IHttpService, IQService } from 'angular';
import { Uri } from 'app/entities/uri';
import { pascalCase, camelCase } from 'change-case';
import { apiEndpointWithName } from './config';

export interface ValidatorService {
  classDoesNotExist(id: Uri): IPromise<boolean>;
  predicateDoesNotExist(id: Uri): IPromise<boolean>;
}

export class DefaultValidatorService implements DefaultValidatorService {

  constructor(private $q: IQService, private $http: IHttpService) {
    'ngInject';
  }

  classDoesNotExist(id: Uri): IPromise<boolean> {
    return this.idDoesNotExist(id.withName(pascalCase(id.name)));
  }

  predicateDoesNotExist(id: Uri): IPromise<boolean> {
    return this.idDoesNotExist(id.withName(camelCase(id.name)));
  }

  private idDoesNotExist(id: Uri): IPromise<boolean> {
    return this.$http.get(apiEndpointWithName('freeID'), {params: {id: id.uri}})
      .then(result => result.data ? true : this.$q.reject('exists'), _err => true);
  }
}
