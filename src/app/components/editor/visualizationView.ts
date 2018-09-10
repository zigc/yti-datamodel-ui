import { Class } from 'app/entities/class';
import { Predicate } from 'app/entities/predicate';
import { Model } from 'app/entities/model';
import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const VisualizationViewComponent: ComponentDeclaration = {
  selector: 'visualizationView',
  bindings: {
    selection: '=',
    model: '=',
    modelPageActions: '=',
    maximized: '='
  },
  template: require('./visualizationView.html'),
  controller: forwardRef(() => VisualizationViewController)
};

export class VisualizationViewController {

  selection: Class|Predicate;
  model: Model;
  maximized: boolean;
}
