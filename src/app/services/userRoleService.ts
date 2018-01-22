import { IHttpService, IPromise } from 'angular';
import { Uri } from 'app/entities/uri';
import { Role } from 'yti-common-ui/services/user.service';
import { config } from 'config';

export interface UserRequest {
  organizationId: string;
  role: Role[];
}

export class UserRoleService {

  /* @ngInject */
  constructor(private $http: IHttpService) {
  }

  sendUserRequest(id: Uri): IPromise<any> {

    const requestParams = {
      organizationId: id.uuid
    };

    return this.$http.post<UserRequest[]>(config.apiEndpointWithName('userRequest'), undefined, {params: requestParams})
      .then(response => response.data!);
  }

  getUserRequests(): IPromise<UserRequest[]> {
    return this.$http.get<UserRequest[]>(config.apiEndpointWithName('userRequest'))
      .then(response => response.data!);
  }
}
