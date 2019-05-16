import { ILocationService, IRootScopeService, route } from 'angular';
import { LocationServiceWrapper, RouteServiceWrapper, ScopeWrapper } from '../ajs-upgraded-providers';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Injectable, OnDestroy } from '@angular/core';
import { isDifferentUrl, nextUrl } from '../utils/angular';
import { Model } from '../entities/model';
import { EditingGuard } from '../components/model/modelControllerService';

type RouteParams = {
  prefix: string;
  resource?: string;
  property?: string;
};

@Injectable()
export class SubRoutingHackService implements OnDestroy {
  currentSelection: BehaviorSubject<RouteData> = new BehaviorSubject(new RouteData({ prefix: '' }));
  private ajsRootScope: IRootScopeService;
  private routeService: route.IRouteService;
  private locationService: ILocationService;
  private initialRoute: route.ICurrentRoute;
  private currentRouteParams: RouteParams;
  private subscriptions: Subscription[] = [];
  private ajsSubscriptions: (() => void)[] = [];
  private editingGuard?: EditingGuard;

  constructor(scopeWrapper: ScopeWrapper, routeWrapper: RouteServiceWrapper, locationWrapper: LocationServiceWrapper) {
    this.ajsRootScope = scopeWrapper.scope;
    this.routeService = routeWrapper.routeService;
    this.locationService = locationWrapper.locationService;

    this.initSubRoutingHack();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.ajsSubscriptions.forEach(s => s());
  }

  initSubRoutingHack() {
    // The logic is mostly transferred from old AngularJS bloat modelPage.ts. The main idea is to emulate sub routing by hacking,
    // to keep the data model level stuff from re-initializing when lower level selections change.

    this.initialRoute = this.routeService.current!;
    this.currentRouteParams = this.initialRoute.params;

    const initialRouteData = new RouteData(this.currentRouteParams);
    this.currentSelection.next(initialRouteData);

    this.ajsSubscriptions.push(this.ajsRootScope.$on('$locationChangeSuccess', () => {
      if (this.locationService.path().startsWith('/model')) {
        this.currentRouteParams = this.routeService.current!.params;
        const newRoute = new RouteData(this.currentRouteParams);

        // FIXME: hack to prevent reload on params update
        // https://github.com/angular/angular.js/issues/1699#issuecomment-45048054
        // TODO: consider migration to angular-ui-router if it fixes the problem elegantly (https://ui-router.github.io/ng1/)
        this.routeService.current = this.initialRoute;

        const oldRoute = this.currentSelection.getValue();
        const modelDiffers = oldRoute.modelPrefix !== newRoute.modelPrefix;
        const resourceDiffers = oldRoute.resourceCurie !== newRoute.resourceCurie;
        const propertyDiffers = oldRoute.propertyId !== newRoute.propertyId;

        if (modelDiffers || resourceDiffers || propertyDiffers) {
          this.currentSelection.next(newRoute);
        }
      } else {
        if (this.currentSelection.getValue().modelPrefix) {
          this.currentSelection.next(new RouteData({ prefix: '' }));
        }
      }
    }));

    this.ajsSubscriptions.push(this.ajsRootScope.$on('$locationChangeStart', (event, next, current) => {
      // NOTE: isDifferentUrl utility ignores propertyId (quite classView specific functionality)
      if (isDifferentUrl(current, next)) {
        if (this.editingGuard) {
          this.editingGuard.attemptRouteChange(() => event.preventDefault(), () => this.locationService.url(nextUrl(this.locationService, next)));
        }
      }
    }));
  }

  navigateTo(modelPrefix: string, resourceCurie?: string, propertyId?: string) {
    // NOTE: Cannot use the signature specified in the interface because it does not allow clearing parameters.
    // const newParams: { [key: string]: string } = {
    const newParams: any = {
      prefix: modelPrefix,
      resource: undefined,
      property: undefined
    };
    if (resourceCurie) {
      newParams.resource = this.cleanCurie(modelPrefix, resourceCurie);
      if (propertyId) {
        newParams.property = propertyId;
      }
    }

    if (newParams.prefix !== this.currentRouteParams.prefix ||
      newParams.resource !== this.currentRouteParams.resource ||
      newParams.property !== this.currentRouteParams.property) {

      this.routeService.updateParams(newParams);
    }
  }

  navigateToRoot() {
    this.locationService.url('/');
  }

  setGuard(guard: EditingGuard): void {
    if (this.editingGuard) {
      console.error('Overwriting existing editing guard registration');
    }
    this.editingGuard = guard;
  }

  unsetGuard(guard: EditingGuard): void {
    if (this.editingGuard === guard) {
      this.editingGuard = undefined;
    } else {
      console.error('Trying to deregister unknown editing guard');
    }
  }

  private cleanCurie(modelPrefix: string, resourceCurie: string): string {
    if (resourceCurie.startsWith(modelPrefix + ':')) {
      return resourceCurie.substring(modelPrefix.length + 1);
    }
    return resourceCurie;
  }
}

export class RouteData {

  modelPrefix: string;
  resourceCurie?: string;
  propertyId?: string;

  constructor(params: RouteParams) {
    this.modelPrefix = params.prefix;

    if (params.resource) {
      const split = params.resource.split(':');

      if (split.length === 1) {
        this.resourceCurie = params.prefix + ':' + params.resource;
      } else if (split.length === 2) {
        this.resourceCurie = params.resource;
      } else {
        throw new Error('Unsupported resource format: ' + params.resource);
      }

      if (params.property) {
        this.propertyId = params.property;
      }
    }
  }

  toString(): string {
    return this.modelPrefix ? this.modelPrefix + (this.resourceCurie ? '/' + this.resourceCurie + (this.propertyId ? '/' + this.propertyId : '') : '') : '';
  }
}

export class ModelAndSelection {
  model?: Model;
  resourceCurie?: string;
  propertyId?: string;

  static fromModelAndRoute(model: Model | undefined, routeData: RouteData): ModelAndSelection {
    if ((model ? model.prefix : '') !== routeData.modelPrefix) {
      throw Error('ModelAndSelection constructed with mismatching model and route data');
    }
    const ret = new ModelAndSelection();
    ret.model = model;
    if (model) {
      ret.resourceCurie = routeData.resourceCurie;
      ret.propertyId = routeData.propertyId;
    }
    return ret;
  }

  equals(other: ModelAndSelection): boolean {
    if ((!!this.model !== !!other.model) || (this.model && (this.model.prefix !== other.model!.prefix))) {
      return false;
    }

    return this.resourceCurie === other.resourceCurie && this.propertyId === other.propertyId;
  }

  toString(): string {
    return this.model ? this.model.prefix + (this.resourceCurie ? '/' + this.resourceCurie + (this.propertyId ? '/' + this.propertyId : '') : '') : '';
  }

  copyWithUpdatedModel(updatedModel: Model): ModelAndSelection {
    if (!this.model || updatedModel.prefix !== this.model.prefix) {
      throw Error(`Updated model prefix "${updatedModel.prefix}" does not match existing one "${this.model ? this.model.prefix : 'undefined'}".`);
    }
    const ret = new ModelAndSelection();
    ret.model = updatedModel;
    ret.resourceCurie = this.resourceCurie;
    ret.propertyId = this.propertyId;
    return ret;
  }
}
