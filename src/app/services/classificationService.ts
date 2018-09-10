import { IHttpService, IPromise } from 'angular';
import { GraphData } from 'app/types/entity';
import * as frames from 'app/entities/frames';
import { Classification } from 'app/entities/classification';
import { FrameService } from './frameService';
import { comparingPrimitive } from 'yti-common-ui/utils/comparator';
import { apiEndpointWithName } from './config';

export class ClassificationService {

  /* @ngInject */
  constructor(private $http: IHttpService,
              private frameService: FrameService) {
  }

  getClassifications(): IPromise<Classification[]> {

    return this.$http.get<GraphData>(apiEndpointWithName('serviceCategories'), {
      headers: { Accept: 'application/ld+json'}
    })
      .then(response => this.deserializeClassification(response.data!))
      .then(classifications => {
        classifications.sort(comparingPrimitive<Classification>(c => c.order));
        return classifications;
      });
  }

  private deserializeClassification(data: GraphData): IPromise<Classification[]> {
    return this.frameService.frameAndMapArray(data, frames.classificationListFrame(data), () => Classification);
  }
}
