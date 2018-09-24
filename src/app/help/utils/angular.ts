import { INgModelController } from 'angular';

export function getModalController<T>(controllerName = '$ctrl') {
  return (jQuery('.modal').scope() as any)[controllerName] as T;
}

export function getModelControllerFromInput(element: JQuery): INgModelController {

  const ngModel: INgModelController = element.controller('ng-model');

  if (!ngModel) {
    console.log(element);
    throw new Error('No ng-model for element');
  }

  return ngModel;
}
