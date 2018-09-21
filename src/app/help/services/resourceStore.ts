import { IPromise, IQService } from 'angular';
import { Model } from 'app/entities/model';
import { Uri, Url } from 'app/entities/uri';
import { flatten } from 'yti-common-ui/utils/array';
import { DefinedBy } from 'app/entities/definedBy';
import { Optional, requireDefined } from 'yti-common-ui/utils/object';

type ModelId = string;
type ResourceId = string;
type ResourceEntry<T> = [ResourceId, T];
type Namespace = string;

export class ResourceStore<T extends { id: Uri }> {

  resources = new Map<ResourceId, T>();

  values(): T[] {
    return Array.from(this.resources.values());
  }

  entries(): [ResourceId, T][] {
    return Array.from(this.resources.entries());
  }

  find(id: ResourceId): T|undefined {
    return this.resources.get(id);
  }

  get(id: ResourceId): T {
    return requireDefined(this.find(id));
  }

  add(resource: T) {
    this.resources.set(resource.id.uri, resource);
  }

  delete(id: ResourceId): boolean {
    return this.resources.delete(id);
  }

  findFirst(predicate: (item: T) => boolean): Optional<T> {
    return Array.from(this.resources.values()).find(predicate);
  }

  findAll(predicate: (item: T) => boolean): T[] {
    return Array.from(this.resources.values()).filter(predicate);
  }

  clear() {
    this.resources.clear();
  }
}

export class ModelResourceStore<T extends { id: Uri }> {

  private resources = new Map<ModelId, ResourceStore<T>>();
  private assignedResources = new Map<ModelId, Set<ResourceId>>();
  private externalResources = new Map<Namespace, ResourceStore<T>>();

  constructor(private $q: IQService) {
  }

  getResourcesForAllModels(): Map<ResourceId, T> {
    return ModelResourceStore.createMapFromEntries(this.getAllResourceEntries());
  }

  resourceExistsInAnyModel(id: ResourceId): boolean {
    return this.getResourcesForAllModels().has(id);
  }

  getResourceValuesForAllModels(): T[] {
    return Array.from(this.getResourcesForAllModels().values());
  }

  private getAllResourceEntries(): ResourceEntry<T>[] {
    return flatten(Array.from(this.resources.values()).map(s => s.entries()));
  }

  getResourcesForModel(model: Model|DefinedBy): ResourceStore<T> {
    let store = this.resources.get(model.id.uri);

    if (!store) {
      store = new ResourceStore<T>();
      this.resources.set(model.id.uri, store);
    }

    return store;
  }

  getExternalResourcesForNamespace(ns: Namespace): T[] {
    return requireDefined(this.externalResources.get(ns)).values();
  }

  findExternalResource(id: Uri): T|null {

    const uri = id.uri;

    for (const [ns, store] of Array.from(this.externalResources.entries())) {
      if (uri.startsWith(ns)) {
        return store.get(uri);
      }
    }

    return null;
  }

  getAssignedResourcesIdsForModel(model: Model|DefinedBy): Set<ResourceId> {
    const resourceSet = this.assignedResources.get(model.id.uri);

    if (!resourceSet) {
      const newSet = new Set<ResourceId>();
      this.assignedResources.set(model.id.uri, newSet);
      return newSet;
    } else {
      return resourceSet;
    }
  }

  getAssignedResourcesForModel(model: Model): IPromise<Map<ResourceId, T>> {

    const assignedIds = this.getAssignedResourcesIdsForModel(model);
    const allResources: [ResourceId, T][] = this.getAllResourceEntries();
    const assignedResourcesFromStore = ModelResourceStore.createMapFromEntries(allResources.filter(([id]) => assignedIds.has(id)));
    return this.$q.when(assignedResourcesFromStore);
  }

  getAllResourcesForModel(model: Model): IPromise<Map<ResourceId, T>> {
    return this.getAssignedResourcesForModel(model)
      .then(assignedResources => ModelResourceStore.createMapFromEntries(assignedResources.entries(), this.getResourcesForModel(model).entries()));
  }

  getAllResourceValuesForModel(model: Model): IPromise<T[]> {
    return this.getAllResourcesForModel(model).then(resources => Array.from(resources.values()));
  }

  getResourceForAnyModelById(id: Uri|Url): T {
    return requireDefined(this.getResourcesForAllModels().get(id.toString()));
  }

  getInternalOrExternalResource(id: Uri): T|null {

    const internal = this.getResourcesForAllModels().get(id.toString());

    if (internal) {
      return internal;
    } else {
      return this.findExternalResource(id);
    }
  }

  assignResourceToModel(model: Model|DefinedBy, id: ResourceId) {
    this.getAssignedResourcesIdsForModel(model).add(id);
  }

  addResourceToModel(model: Model|DefinedBy, resource: T) {
    this.getResourcesForModel(model).add(resource);
  }

  updateResourceInModel(model: Model|DefinedBy, resource: T, originalId: ResourceId) {
    this.deleteResourceFromModel(model, originalId);
    this.getResourcesForModel(model).add(resource);
  }

  deleteResourceFromModel(model: Model|DefinedBy, resourceId: ResourceId) {
    this.getResourcesForModel(model).delete(resourceId);
    this.getAssignedResourcesIdsForModel(model).delete(resourceId);
  }

  private static createMapFromEntries<V>(...entries: Iterable<ResourceEntry<V>>[]): Map<ResourceId, V> {
    return new Map<ResourceId, V>(flatten(entries.map(e => Array.from(e))));
  }

  clear() {
    this.resources.clear();
    this.assignedResources.clear();
  }
}
