import { IPromise, IQService } from 'angular';
import { ModelPositions } from 'app/entities/visualization';
import { Model } from 'app/entities/model';
import { ClassVisualization } from 'app/services/visualizationService';
import { DefaultVisualizationService, VisualizationService } from 'app/services/visualizationService';
import { ResetableService } from './resetableService';
import { InteractiveHelpClassService } from './helpClassService';

export class InteractiveHelpVisualizationService implements VisualizationService, ResetableService {

  private modelPositions = new Map<string, ModelPositions>();

  constructor(private $q: IQService, private defaultVisualizationService: DefaultVisualizationService, private helpClassService: InteractiveHelpClassService) {
    'ngInject';
  }

  reset(): IPromise<any> {
    this.modelPositions.clear();
    return this.$q.when();
  }

  getVisualization(model: Model): IPromise<ClassVisualization> {

    const savedPosition = this.modelPositions.get(model.id.uri);
    const position = savedPosition || this.defaultVisualizationService.newModelPositions(model);

    return this.helpClassService.store.getAllResourceValuesForModel(model).then(classes => new ClassVisualization(classes, position));
  }

  updateModelPositions(model: Model, modelPositions: ModelPositions): IPromise<any> {
    this.modelPositions.set(model.id.uri, modelPositions.clone());
    return this.$q.when();
  }
}
