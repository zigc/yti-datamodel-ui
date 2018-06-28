import { config } from 'config';
import { expandContextWithKnownModels } from 'app/utils/entity';
import { index } from 'yti-common-ui/utils/array';
import { requireDefined } from 'yti-common-ui/utils/object';
import * as frames from 'app/entities/frames';
import { FrameService } from './frameService';
import { GraphData } from 'app/types/entity';
import { ModelPositions, VisualizationClass, DefaultVisualizationClass } from 'app/entities/visualization';
import { Model } from 'app/entities/model';
import { IPromise, IQService, IHttpService } from 'angular';
import { normalizeAsArray } from 'yti-common-ui/utils/array';

export interface VisualizationService {
  getVisualization(model: Model): IPromise<ClassVisualization>;
  updateModelPositions(model: Model, modelPositions: ModelPositions): IPromise<any>;
}

export class DefaultVisualizationService implements VisualizationService {

  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService, private frameService: FrameService) {
  }

  getVisualization(model: Model) {
    return this.$q.all([this.getVisualizationClasses(model), this.getModelPositions(model)])
      .then(([classes, positions]) => new ClassVisualization(classes, positions));
  }

  private getVisualizationClasses(model: Model) {

    const params = {
      graph: model.id.uri
    };

    return this.$http.get<GraphData>(config.apiEndpointWithName('framedGraphs'), { params })
      .then(expandContextWithKnownModels(model))
      .then(response => {
        const framed = response.data!;
        try {          
          return normalizeAsArray(framed['@graph']).map(element => {
            return new DefaultVisualizationClass(element, framed['@context'], null);
          });          
        }
        catch (error) {
          console.log(error);          
          throw error;          
        }        
      });      
  }
  
  private getModelPositions(model: Model) {
    return this.$http.get<GraphData>(config.apiEndpointWithName('modelPositions'), { params: { model: model.id.uri } })
      .then(expandContextWithKnownModels(model))
      .then(response => this.deserializeModelPositions(response.data!), _err => this.newModelPositions(model));
  }

  updateModelPositions(model: Model, modelPositions: ModelPositions) {
    return this.$http.put(config.apiEndpointWithName('modelPositions'), modelPositions.serialize(), { params: { model: model.id.uri } });
  }

  newModelPositions(model: Model) {
    const frame: any = frames.modelPositionsFrame({ '@context': model.context });
    return new ModelPositions([], frame['@context'], frame);
  }

  private deserializeModelPositions(data: GraphData): IPromise<ModelPositions> {
    return this.frameService.frameAndMapArrayEntity(data, frames.modelPositionsFrame(data), () => ModelPositions);    
  }
}

export class ClassVisualization {

  private classes: Map<string, VisualizationClass>;

  constructor(classes: VisualizationClass[], public positions: ModelPositions) {
    this.classes = index(classes, klass => klass.id.toString());
  }

  get size() {
    return this.classes.size;
  }

  removeClass(classId: string) {
    this.classes.delete(classId);
  }

  addOrReplaceClass(klass: VisualizationClass) {
    this.classes.set(klass.id.toString(), klass);
  }

  getClasses() {
    return Array.from(this.classes.values());
  }

  hasClass(classId: string) {
    return this.classes.has(classId);
  }

  getClassById(classId: string) {
    return requireDefined(this.classes.get(classId));
  }

  getClassIds() {
    return new Set(this.classes.keys());
  }

  getClassIdsWithoutPosition() {
    return Array.from(this.classes.values()).filter(c => !this.positions.isClassDefined(c.id)).map(c => c.id);
  }

  addPositionChangeListener(listener: () => void) {
    this.positions.addChangeListener(listener);
  }
}
