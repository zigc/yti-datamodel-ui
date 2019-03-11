import { ILocationService, IRootScopeService, IScope, route } from 'angular';
import IInjectorService = angular.auto.IInjectorService;
import { ModelService } from './services/modelService';
import { NotificationModal } from './components/common/notificationModal';
import { ConfirmationModal } from './components/common/confirmationModal';

// NOTE: In normal case the "wrappers" should not be needed, but I could not figure out the way to make it work with the interfaces.

export class ModelServiceWrapper {
  constructor(public modelService: ModelService) {
  }
}

export function modelServiceFactory(i: IInjectorService) {
  return new ModelServiceWrapper(i.get('modelService'))
}

export const modelServiceProvider = {
  provide: ModelServiceWrapper,
  useFactory: modelServiceFactory,
  deps: ['$injector']
};


export class LocationServiceWrapper {
  constructor(public locationService: ILocationService) {
  }
}

export function locationServiceFactory(i: IInjectorService) {
  return new LocationServiceWrapper(i.get('$location'));
}

export const locationServiceProvider = {
  provide: LocationServiceWrapper,
  useFactory: locationServiceFactory,
  deps: ['$injector']
};


export class RouteServiceWrapper {
  constructor(public routeService: route.IRouteService) {
  }
}

export function routeServiceFactory(i: IInjectorService) {
  return new RouteServiceWrapper(i.get('$route'));
}

export const routeServiceProvider = {
  provide: RouteServiceWrapper,
  useFactory: routeServiceFactory,
  deps: ['$injector']
}


export class ScopeWrapper {
  constructor(public scope: IRootScopeService) {
  }
}

export function scopeFactory(i: IInjectorService) {
  return new ScopeWrapper(i.get('$rootScope'));
}

export const scopeProvider = {
  provide: ScopeWrapper,
  useFactory: scopeFactory,
  deps: ['$injector']
}


export function notificationModalFactory(i: IInjectorService) {
  return i.get('notificationModal');
}

export const notificationModalProvider = {
  provide: NotificationModal,
  useFactory: notificationModalFactory,
  deps: ['$injector']
}


export function confirmationModalFactory(i: IInjectorService) {
  return i.get('confirmationModal');
}

export const confirmationModalProvider = {
  provide: ConfirmationModal,
  useFactory: confirmationModalFactory,
  deps: ['$injector']
}
