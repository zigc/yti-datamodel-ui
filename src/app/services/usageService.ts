import { IHttpService, IPromise } from 'angular';
import { EditableEntity, GraphData } from 'app/types/entity';
import { FrameService } from './frameService';
import { usageFrame } from 'app/entities/frames';
import { Usage, EmptyUsage, DefaultUsage } from 'app/entities/usage';
import { apiEndpointWithName } from './config';

export class UsageService {
  /* @ngInject */
  constructor(private $http: IHttpService, private frameService: FrameService) {
  }

  getUsage(entity: EditableEntity): IPromise<Usage> {
    const params = entity.isOfType('model')   ? { model:   entity.id.uri }
                 : entity.isOfType('concept') ? { concept: entity.id.uri }
                                              : { id:      entity.id.uri };

    return this.$http.get<GraphData>(apiEndpointWithName('usage'), {params})
      .then(response => this.deserializeUsage(response.data!))
      .then(usage => {
        if (usage) {
          return usage;
        } else {
          return new EmptyUsage(entity);
        }
      });
  }

  private deserializeUsage(data: GraphData): IPromise<Usage|null> {
    return this.frameService.frameAndMap(data, true, usageFrame(data), () => DefaultUsage);
  }
}
