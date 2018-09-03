import { IHttpService, IPromise } from 'angular';
import { config } from 'config';
import { Uri } from 'app/entities/uri';
import { GraphData } from 'app/types/entity';
import { FrameService } from './frameService';
import * as frames from 'app/entities/frames';
import { Activity } from 'app/entities/version';
import { requireDefined } from '../../../node_modules/yti-common-ui/utils/object';

export class HistoryService {

  /* @ngInject */
  constructor(private $http: IHttpService, private frameService: FrameService) {
  }

  getHistory(id: Uri): IPromise<Activity> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('history'), {params: {id: id.uri}})
      .then(response => this.deserializeVersion(response.data!));
  }

  private deserializeVersion(data: GraphData): IPromise<Activity> {
    return this.frameService.frameAndMap(data, false, frames.versionFrame(data), () => Activity).then(requireDefined);
  }
}
