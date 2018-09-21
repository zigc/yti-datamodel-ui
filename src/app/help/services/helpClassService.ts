import { IPromise, IQService } from 'angular';
import { ClassService } from 'app/services/classService';
import { Class, Property } from 'app/entities/class';
import { Model } from 'app/entities/model';
import { Uri, Urn } from 'app/entities/uri';
import { DataSource } from 'app/components/form/dataSource';
import { Language } from 'app/types/language';
import { ExternalEntity } from 'app/entities/externalEntity';
import { Predicate } from 'app/entities/predicate';
import { KnownPredicateType } from 'app/types/entity';
import { ResetableService } from './resetableService';
import * as moment from 'moment';
import { VocabularyService } from 'app/services/vocabularyService';
import { ModelResourceStore } from './resourceStore';
import { Concept } from 'app/entities/vocabulary';
import { flatten } from 'yti-common-ui/utils/array';
import { EntityCreatorService } from './entityCreatorService';
import { requireDefined } from 'yti-common-ui/utils/object';

export class InteractiveHelpClassService implements ClassService, ResetableService {

  private store = new ModelResourceStore<Class>(this.$q);

  constructor(private $q: IQService,
              private entityCreatorService: EntityCreatorService,
              private helpVocabularyService: VocabularyService) {
    'ngInject';
  }

  reset(): IPromise<any> {
    this.store.clear();
    return this.$q.when();
  }

  getClass(id: Uri|Urn, model: Model): IPromise<Class> {
    return this.$q.when(this.store.getResourceForAnyModelById(id));
  }

  getAllClasses(model: Model): IPromise<Class[]> {
    return this.$q.when(this.store.getResourceValuesForAllModels());
  }

  getClassesForModel(model: Model): IPromise<Class[]> {
    return this.store.getAllResourceValuesForModel(model);
  }

  getClassesForModelDataSource(modelProvider: () => Model): DataSource<Class> {
    return (_search: string) => this.getClassesForModel(modelProvider());
  }

  getClassesAssignedToModel(model: Model): IPromise<Class[]> {
    return this.store.getAllResourceValuesForModel(model);
  }

  createClass(klass: Class): IPromise<any> {
    klass.unsaved = false;
    klass.createdAt = moment();
    this.store.addResourceToModel(klass.definedBy, klass);
    return this.$q.when();
  }

  updateClass(klass: Class, originalId: Uri): IPromise<any> {
    klass.modifiedAt = moment();
    this.store.updateResourceInModel(klass.definedBy, klass, originalId.uri);
    return this.$q.when();
  }

  deleteClass(id: Uri, model: Model): IPromise<any> {
    this.store.deleteResourceFromModel(model, id.uri);
    return this.$q.when();
  }

  assignClassToModel(classId: Uri, model: Model): IPromise<any> {
    this.store.assignResourceToModel(model, classId.uri);
    return this.$q.when();
  }

  newClass(model: Model, classLabel: string, conceptID: Uri|null, lang: Language): IPromise<Class> {

    const conceptPromise: IPromise<Concept|null> = conceptID ? this.helpVocabularyService.getConcept(conceptID) : this.$q.when(null);

    return conceptPromise
      .then(concept => {
        return this.entityCreatorService.createClass({
          model: model,
          lang: lang,
          label: classLabel,
          concept: concept ? concept : undefined
        }).then(klass => {
          klass.unsaved = true;
          return klass;
        });
      });
  }

  newShape(classOrExternal: Class|ExternalEntity, profile: Model, external: boolean, lang: Language): IPromise<Class> {

    const id = requireDefined(classOrExternal.id);
    const classPromise = (classOrExternal instanceof ExternalEntity) ? this.getExternalClass(id, profile).then(requireDefined) : this.$q.when(classOrExternal);

    return classPromise
      .then(klass => this.entityCreatorService.createShape(klass, profile));
  }

  newClassFromExternal(externalId: Uri, model: Model): IPromise<Class> {
    throw new Error('newClassFromExternal is not yet supported in help');
  }

  getExternalClass(externalId: Uri, _model: Model): IPromise<Class|null> {
    return this.$q.when(this.store.findExternalResource(externalId));
  }

  getExternalClassesForModel(model: Model): IPromise<Class[]> {
    const externalNamespaces = model.importedNamespaces.filter(ns => ns.external);
    const externalResources = flatten(externalNamespaces.map(ns => this.store.getExternalResourcesForNamespace(ns.url)));
    return this.$q.when(externalResources);
  }

  newProperty(predicateOrExternal: Predicate|ExternalEntity, type: KnownPredicateType, model: Model): IPromise<Property> {
    if (predicateOrExternal instanceof ExternalEntity) {
      throw new Error('new property from external is not yet supported in help');
    } else {
      return this.entityCreatorService.createProperty({
        predicate: predicateOrExternal,
        type: type
      }).then(newProperty => {
        newProperty.status = 'DRAFT';
        return newProperty;
      });
    }
  }

  getInternalOrExternalClass(id: Uri, _model: Model): IPromise<Class|null> {
    return this.$q.when(this.store.getInternalOrExternalResource(id));
  }

  classExists(id: Uri) {
    return this.store.resourceExistsInAnyModel(id.toString());
  }
}
