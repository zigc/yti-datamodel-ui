import { IHttpService, IPromise } from 'angular';
import { Uri } from 'app/entities/uri';
import { GraphData } from 'app/types/entity';
import { FrameService } from './frameService';
import * as frames from 'app/entities/frames';
import { Activity } from 'app/entities/version';
import { requireDefined } from 'yti-common-ui/utils/object';
import { apiEndpointWithName } from './config';

export class HistoryService {

  constructor(private $http: IHttpService, private frameService: FrameService) {
    'ngInject';
  }

  getHistory(id: Uri): IPromise<Activity> {
    return this.$http.get<GraphData>(apiEndpointWithName('history'), {params: {id: id.uri}})
      .then(response => this.deserializeVersion(response.data!));
  }

  private deserializeVersion(data: GraphData): IPromise<Activity> {
    return this.frameService.frameAndMap(data, false, frames.versionFrame(data), () => Activity).then(requireDefined);
  }
}
