import { IFormController, ILocationService } from 'angular';
import { module as mod } from './module';
import { ModelService } from 'app/services/modelService';
import { Uri } from 'app/entities/uri';
import { Language, LanguageContext } from 'app/types/language';
import { KnownModelType } from 'app/types/entity';
import { LocationService } from 'app/services/locationService';
import { Classification } from '../../entities/classification';
import { remove } from 'yti-common-ui/utils/array';
import { Organization } from '../../entities/organization';
import { ErrorModal } from '../form/errorModal';
import { Vocabulary } from '../../entities/vocabulary';
import { ReferenceData } from '../../entities/referenceData';
import { ImportedNamespace } from '../../entities/model';

interface EditableForm extends IFormController {
  editing: boolean;
}

mod.directive('newModelPage', () => {
  return {
    restrict: 'E',
    scope: {
      type: '='
    },
    template: require('./newModelPage.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: NewModelPageController
  };
});

export class NewModelPageController {

  prefix: string;
  label: string;
  comment: string;

  classifications: Classification[] = [];
  contributors:  Organization[] = [];
  vocabularies: Vocabulary[] = [];
  referenceDatas: ReferenceData[] = [];
  importedNamespaces: ImportedNamespace[] = [];

  languages: Language[] = ['fi', 'en'];
  type: KnownModelType;

  context: LanguageContext = {
    id: new Uri('http://newModel', {}),
    language: this.languages
  };

  persisting = false;
  form: EditableForm;

  namespacesInUse = new Set<string>();

  /* @ngInject */
  constructor(private $location: ILocationService,
              private modelService: ModelService,
              locationService: LocationService,
              private errorModal: ErrorModal) {

    locationService.atNewModel(this.type);
  }

  $postLink() {
    this.form.editing = true;
  }

  get allowProfiles() {
    return this.type === 'profile';
  }

  isValid() {
    return this.form.$valid && this.classifications.length > 0 && this.contributors.length > 0;
  }

  addClassification(classification: Classification) {
    this.classifications.push(classification);
  }

  removeClassification(classification: Classification) {
    remove(this.classifications, classification);
  }

  addContributor(organization: Organization) {
    this.contributors.push(organization);
  }

  removeContributor(organization: Organization) {
    remove(this.contributors, organization);
  }

  addVocabulary(vocabulary: Vocabulary) {
    this.vocabularies.push(vocabulary);
  }

  removeVocabulary(vocabulary: Vocabulary) {
    remove(this.vocabularies, vocabulary);
  }

  addReferenceData(referenceData: ReferenceData) {
    this.referenceDatas.push(referenceData);
  }

  removeReferenceData(referenceData: ReferenceData) {
    remove(this.referenceDatas, referenceData);
  }

  addImportedNamespace(namespace: ImportedNamespace) {
    this.importedNamespaces.push(namespace);
  }

  removeImportedNamespace(namespace: ImportedNamespace) {
    remove(this.importedNamespaces, namespace);
  }

  save() {

    this.persisting = true;

    const orgIds = this.contributors.map(o => o.id.uuid);
    const classificationIds = this.classifications.map(c => c.identifier);

    this.modelService.newModel(this.prefix, this.label, classificationIds, orgIds, this.languages, this.type)
      .then(model => {
        // XXX: should comment go to model creator api?
        model.comment = { [this.languages[0]]: this.comment };
        this.vocabularies.forEach(v => model.addVocabulary(v));
        this.referenceDatas.forEach(r => model.addReferenceData(r));
        this.importedNamespaces.forEach(ns => model.addImportedNamespace(ns));
        this.modelService.createModel(model).then(() => {
          this.$location.url(model.iowUrl());
        }, () => this.persisting = false);
      }, err => {
        this.errorModal.openSubmitError((err.data && err.data.errorMessage) || 'Unexpected error');
        this.persisting = false;
      });
  }

  cancel() {
    this.$location.url('/');
  }
}
