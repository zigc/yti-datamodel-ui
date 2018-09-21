import { IPromise, IQService } from 'angular';
import { ModelPositions } from 'app/entities/visualization';
import { Model } from 'app/entities/model';
import { ClassVisualization, VisualizationService } from 'app/services/visualizationService';
import { ResetableService } from './resetableService';
import { InteractiveHelpClassService } from './helpClassService';
import * as frames from 'app/entities/frames';

export class InteractiveHelpVisualizationService implements VisualizationService, ResetableService {

  private modelPositions = new Map<string, ModelPositions>();

  constructor(private $q: IQService,
              private helpClassService: InteractiveHelpClassService) {
    'ngInject';
  }

  reset(): IPromise<any> {
    this.modelPositions.clear();
    return this.$q.when();
  }

  getVisualization(model: Model): IPromise<ClassVisualization> {

    const savedPosition = this.modelPositions.get(model.id.uri);
    const position = savedPosition || this.newModelPositions(model);

    return this.helpClassService.getAllClasses(model).then(classes => new ClassVisualization(classes, position));
  }

  newModelPositions(model: Model) {
    const frame: any = frames.modelPositionsFrame({ '@context': model.context });
    return new ModelPositions([], frame['@context'], frame);
  }

  updateModelPositions(model: Model, modelPositions: ModelPositions): IPromise<any> {
    this.modelPositions.set(model.id.uri, modelPositions.clone());
    return this.$q.when();
  }
}
