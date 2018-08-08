import { IPromise, IQService } from 'angular';
import { ClassService } from 'app/services/classService';
import { Class, ClassListItem, Property } from 'app/entities/class';
import { Model } from 'app/entities/model';
import { Urn, Uri } from 'app/entities/uri';
import { DataSource } from 'app/components/form/dataSource';
import { Language } from 'app/types/language';
import { ExternalEntity } from 'app/entities/externalEntity';
import { Predicate, Association, Attribute } from 'app/entities/predicate';
import { KnownPredicateType } from 'app/types/entity';
import { reverseMapType } from 'app/utils/entity';
import { ResetableService } from './resetableService';
import * as moment from 'moment';
import { upperCaseFirst } from 'change-case';
import * as frames from 'app/entities/frames';
import { VocabularyService } from 'app/services/vocabularyService';
import { flatten } from 'yti-common-ui/utils/array';
import { dateSerializer } from 'app/entities/serializer/serializer';
import { ModelResourceStore } from './resourceStore';
import { DefinedBy } from 'app/entities/definedBy';
import { Concept } from 'app/entities/vocabulary';
import { classNameToResourceIdName } from 'app/help/utils';

export class InteractiveHelpClassService implements ClassService, ResetableService {

  store = new ModelResourceStore<Class>(this.$q, (id, model) => this.defaultClassService.getClass(id, model));
  trackedModels = new Set<string>();

  trackModel = (model: Model|DefinedBy) => this.trackedModels.add(model.id.uri);
  tracksModel = (model: Model|DefinedBy) => this.trackedModels.has(model.id.uri);


  /* @ngInject */
  constructor(private $q: IQService,
              private defaultClassService: ClassService,
              private helpVocabularyService: VocabularyService) {
  }

  reset(): IPromise<any> {
    this.store.clear();
    return this.$q.when();
  }

  getClass(id: Uri|Urn, model: Model): IPromise<Class> {

    const resource = this.store.getResourceForAnyModelById(id);

    if (resource) {
      return this.$q.when(resource);
    } else {
      return this.defaultClassService.getClass(id, model);
    }
  }

  getAllClasses(model: Model): IPromise<ClassListItem[]> {

    const resources = this.store.getResourcesForAllModels();

    return this.defaultClassService.getAllClasses(model)
      .then(classes => classes.filter(klass => !resources.has(klass.id.toString())))
      .then(nonConflictingClasses => flatten([nonConflictingClasses, Array.from(resources.values())]));
  }

  getClassesForModel(model: Model): IPromise<ClassListItem[]> {
    if (this.tracksModel(model)) {
      return this.store.getAllResourceValuesForModel(model);
    } else {
      return this.defaultClassService.getClassesForModel(model);
    }
  }

  getClassesForModelDataSource(modelProvider: () => Model): DataSource<ClassListItem> {
    return (_search: string) => this.getClassesForModel(modelProvider());
  }

  getClassesAssignedToModel(model: Model): IPromise<ClassListItem[]> {
    if (this.tracksModel(model)) {
      return this.store.getAllResourceValuesForModel(model);
    } else {
      return this.defaultClassService.getClassesAssignedToModel(model);
    }
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

        const currentTime = dateSerializer.serialize(moment());

        const graph = {
          '@id': model.namespace + classNameToResourceIdName(classLabel),
          '@type': 'rdfs:Class',
          created: currentTime,
          modified: currentTime,
          subject: concept ? concept.serialize(true, false) : null,
          name: { [lang]: upperCaseFirst(classLabel) },
          description: Object.assign({}, concept ? concept.definition : {}),
          isDefinedBy: model.asDefinedBy().serialize(true, false),
          versionInfo: 'DRAFT'
        };

        const context = Object.assign({}, model.context, { [model.prefix]: model.namespace });
        const newClass = new Class(graph, context, frames.classFrame(graph));
        newClass.unsaved = true;
        return newClass;
      });
  }

  newShape(classOrExternal: Class|ExternalEntity, profile: Model, external: boolean, lang: Language): IPromise<Class> {
    return this.defaultClassService.newShape(classOrExternal, profile, external, lang);
  }

  newClassFromExternal(externalId: Uri, model: Model): IPromise<Class> {
    return this.defaultClassService.newClassFromExternal(externalId, model);
  }

  getExternalClass(externalId: Uri, model: Model): IPromise<Class> {
    return this.defaultClassService.getExternalClass(externalId, model);
  }

  getExternalClassesForModel(model: Model): IPromise<ClassListItem[]> {
    return this.defaultClassService.getExternalClassesForModel(model);
  }

  newProperty(predicateOrExternal: Predicate|ExternalEntity, type: KnownPredicateType, model: Model): IPromise<Property> {
    if (predicateOrExternal instanceof ExternalEntity) {
      return this.defaultClassService.newProperty(predicateOrExternal, type, model);
    } else {

      const currentTime = dateSerializer.serialize(moment());
      const context = Object.assign({}, model.context, predicateOrExternal.context, { [model.prefix]: model.namespace });

      const graph: any = {
        '@id': Uri.randomUUID().toString(),
        created: currentTime,
        type: reverseMapType(type),
        name: Object.assign({}, predicateOrExternal.label),
        description: Object.assign({}, predicateOrExternal.comment),
        path: predicateOrExternal.id.curie
      };

      if (type === 'attribute') {
        if (!predicateIsAttribute(predicateOrExternal)) {
          throw new Error('Predicate must be attribute');
        }
        graph.datatype = predicateOrExternal.dataType || 'xsd:string';
      } else {
        if (!predicateIsAssociation(predicateOrExternal)) {
          throw new Error('Predicate must be association');
        }
        graph.valueShape = predicateOrExternal.valueClass && predicateOrExternal.valueClass.curie;
      }

      const newProperty = new Property(graph, context, frames.propertyFrame({ '@context': context, '@graph': [graph]}));
      newProperty.status = 'DRAFT';

      return this.$q.when(newProperty);
    }
  }

  getInternalOrExternalClass(id: Uri, model: Model): IPromise<Class> {
    return this.defaultClassService.getInternalOrExternalClass(id, model);
  }
}

function predicateIsAssociation(predicate: Predicate): predicate is Association {
  return predicate.isOfType('association');
}

function predicateIsAttribute(predicate: Predicate): predicate is Attribute {
  return predicate.isOfType('attribute');
}
