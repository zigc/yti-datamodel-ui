import { IPromise, IQService } from 'angular';
import { ImportedNamespace, Link, Model, ModelListItem } from 'app/entities/model';
import { Language } from 'app/types/language';
import { Uri, Urn } from 'app/entities/uri';
import { KnownModelType } from 'app/types/entity';
import { ModelService } from 'app/services/modelService';
import { ResetableService } from './resetableService';
import * as moment from 'moment';
import { ResourceStore } from './resourceStore';
import { requireDefined } from 'yti-common-ui/utils/object';
import { EntityCreatorService } from './entityCreatorService';
import { ClassificationService } from 'app/services/classificationService';
import { contains } from 'yti-common-ui/utils/array';
import { InteractiveHelpOrganizationService } from './helpOrganizationService';
import { Status } from 'yti-common-ui/entities/status';
import { BehaviorSubject } from 'rxjs';

export class InteractiveHelpModelService implements ModelService, ResetableService {

  store = new ResourceStore<Model>();

  // This is not yet supported in help
  contentExpired$: BehaviorSubject<string | undefined>;

  constructor(private $q: IQService,
              private defaultModelService: ModelService,
              private classificationService: ClassificationService,
              private helpOrganizationService: InteractiveHelpOrganizationService,
              private entityCreatorService: EntityCreatorService) {
    'ngInject';
  }

  reset(): IPromise<any> {
    this.store.clear();
    return this.$q.when();
  }

  getModels(): IPromise<ModelListItem[]> {
    return this.$q.when(this.store.values());
  }

  getModelByUrn(urn: Uri|Urn): IPromise<Model> {
    return this.$q.when(this.store.get(urn.toString()));
  }

  getModelByPrefix(prefix: string): IPromise<Model> {
    return this.$q.when(requireDefined(this.store.findFirst(model => model.prefix === prefix)));
  }

  createModel(model: Model): IPromise<any> {
    model.unsaved = false;
    model.createdAt = moment();
    this.store.add(model);
    return this.$q.when();
  }

  updateModel(model: Model): IPromise<any> {
    model.modifiedAt = moment();
    this.store.add(model);
    return this.$q.when();
  }

  deleteModel(id: Uri): IPromise<any> {
    this.store.delete(id.uri);
    return this.$q.when();
  }

  newModel(prefix: string, label: string, classifications: string[], organizations: string[], lang: Language[], type: KnownModelType, redirect?: Uri): IPromise<Model> {

    const allClassificationsPromise = this.classificationService.getClassifications();
    const allOrganizationsPromise = this.helpOrganizationService.getOrganizations();

    const classificationsPromise = allClassificationsPromise.then(allClassifications =>
      allClassifications.filter(c => contains(classifications, c.identifier)));

    const organizationsPromise = allOrganizationsPromise.then(allOrganizations =>
      allOrganizations.filter(o => contains(organizations, o.id.uri)));

    return this.$q.all([classificationsPromise, organizationsPromise]).then(([cs, os]) => {
      return this.entityCreatorService.createModel({
        type,
        label: { [lang[0]]: label },
        prefix,
        organizations: os,
        classifications: cs,
        languages: lang
      })
    });
  }

  newModelRequirement(model: Model, resourceUri: string): IPromise<any> {
    throw new Error('newModelRequirement is not yet supported operation in help');
  }

  newLink(title: string, description: string, homepage: Uri, lang: Language): IPromise<Link> {
    throw new Error('newLink is not yet supported operation in help');
  }

  getAllImportableNamespaces(): IPromise<ImportedNamespace[]> {
    return this.entityCreatorService.createImportedNamespaces(this.store.values());
  }

  newNamespaceImport(namespace: string, prefix: string, label: string, lang: Language): IPromise<ImportedNamespace> {
    return this.entityCreatorService.createImportedNamespace({
      namespace,
      prefix,
      label: { [lang]: label }
    });
  }

  changeStatuses(model: Model, initialStatus: Status, endStatus: Status): IPromise<any> {
    throw new Error('changeStatuses is not yet supported operation in help');
  }
}
