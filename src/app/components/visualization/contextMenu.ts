import { Coordinate } from 'app/types/visualization';
import { IScope } from 'angular';
import { Optional, requireDefined } from 'yti-common-ui/utils/object';
import { VisualizationClass } from 'app/entities/visualization';
import { Model } from 'app/entities/model';
import { ClassService } from 'app/services/classService';
import { ModelPageActions } from 'app/components/model/modelPage';
import { labelNameToResourceIdIdentifier } from 'yti-common-ui/utils/resource';
import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export interface ContextMenuTarget {
  coordinate: Coordinate;
  target: VisualizationClass;
}

export const VisualizationContextMenuComponent: ComponentDeclaration = {
  selector: 'visualizationContextMenu',
  bindings: {
    model: '=',
    modelPageActions: '=',
    target: '='
  },
  template: `
      <div class="dropdown-menu show" role="menu" ng-style="$ctrl.style" ng-if="$ctrl.actions.length > 0">
        <div class="dropdown-item" role="menuitem" ng-repeat="action in $ctrl.actions">
          <a id="{{$ctrl.getIdNameFromActionName(action.name) + '_context_dropdown_action'}}" ng-click="$ctrl.invokeAction(action)">{{action.name | translate}}</a>
        </div>
      </div>
  `,
  controller: forwardRef(() => VisualizationContextMenuController)
};

interface Action {
  name: string;
  invoke: () => void;
}

class VisualizationContextMenuController {

  model: Model;
  modelPageActions: ModelPageActions;
  target: Optional<ContextMenuTarget>;
  actions: Action[] = [];
  style: any;

  /* @ngInject */
  constructor(private $scope: IScope,
              private classService: ClassService) {
  }

  $onInit() {

    this.$scope.$watch(() => this.target, target => {
      if (target) {

        this.style = {
          left: target.coordinate.x,
          top: target.coordinate.y
        };

        this.actions = [];

        if (!target.target.resolved) {
          if (this.model.isOfType('library')) {
            this.actions.push({ name: 'Assign class to library', invoke: () => this.assignClassToModel() });
          } else {
            this.actions.push({ name: 'Specialize class to profile', invoke: () => this.specializeClass() });
          }
        }
      }
    });
  }

  assignClassToModel() {
    this.classService.getClass(this.target!.target.id, this.model)
      .then(klass => this.modelPageActions.assignClassToModel(klass));
  }

  specializeClass() {
    this.classService.getInternalOrExternalClass(this.target!.target.id, this.model)
      .then(klassOrNull => {
        const klass = requireDefined(klassOrNull); // TODO: check if class can actually be null
        this.modelPageActions.createShape(klass, klass.external)
      });
  }

  dismiss() {
    this.target = null;
    this.actions = [];
  }

  invokeAction(action: Action) {
    action.invoke();
    this.dismiss();
  }

  getIdNameFromActionName(actionName: string) {
    return labelNameToResourceIdIdentifier(actionName);
  }
}
