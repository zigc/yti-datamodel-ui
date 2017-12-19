import { IHttpService, IPromise } from 'angular';
import { GraphData } from 'app/types/entity';
import { config } from 'config';
import * as frames from 'app/entities/frames';
import { Classification } from 'app/entities/classification';
import { FrameService } from './frameService';

export class ClassificationService {

  /* @ngInject */
  constructor(private $http: IHttpService,
              private frameService: FrameService) {
  }

  getClassifications(): IPromise<Classification[]> {

    return this.$http.get<GraphData>(config.apiEndpointWithName('serviceCategories'), {
      headers: { Accept: 'application/ld+json'}
    })
      .then(response => this.deserializeClassification(response.data!));
  }

  private deserializeClassification(data: GraphData): IPromise<Classification[]> {
    return this.frameService.frameAndMapArray(data, frames.classificationListFrame(data), () => Classification);
  }
}
