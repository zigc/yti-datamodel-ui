import { ILocationService, IScope } from 'angular';
import { ModelService } from 'app/services/modelService';
import { Uri } from 'app/entities/uri';
import { Language, LanguageContext } from 'app/types/language';
import { KnownModelType, UseContext } from 'app/types/entity';
import { LocationService } from 'app/services/locationService';
import { Classification } from 'app/entities/classification';
import { remove } from 'yti-common-ui/utils/array';
import { Organization } from 'app/entities/organization';
import { ErrorModal } from 'app/components/form/errorModal';
import { Vocabulary } from 'app/entities/vocabulary';
import { ReferenceData } from 'app/entities/referenceData';
import { ImportedNamespace, Link } from 'app/entities/model';
import { LegacyComponent } from 'app/utils/angular';
import { EditableForm } from 'app/components/form/editableEntityController';
import { Localizable } from 'yti-common-ui/types/localization';

@LegacyComponent({
  bindings: {
    type: '='
  },
  template: require('./newModelPage.html')
})
export class NewModelPageComponent {

  prefix: string;
  label: string;
  comment: string;
  contact: Localizable;

  classifications: Classification[] = [];
  contributors:  Organization[] = [];
  vocabularies: Vocabulary[] = [];
  referenceDatas: ReferenceData[] = [];
  importedNamespaces: ImportedNamespace[] = [];
  importedPrefixes: () => string[];
  links: Link[] = [];

  languages: Language[] = ['fi', 'en'];
  type: KnownModelType;
  useContext: UseContext = 'InformationDescription';

  context: LanguageContext = {
    id: new Uri('http://newModel', {}),
    language: this.languages
  };

  persisting = false;
  form: EditableForm;

  namespacesInUse = new Set<string>();

  constructor($scope: IScope,
              private $location: ILocationService,
              private modelService: ModelService,
              private locationService: LocationService,
              private errorModal: ErrorModal) {
    'ngInject';

    this.importedPrefixes = () => {
      if (this.importedNamespaces) {
        return this.importedNamespaces.map(ns => ns.prefix);
      }
      return [];
    }
  }

  $onInit() {
    this.locationService.atNewModel(this.type);
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

  addLink(link: Link) {
    this.links.push(link);
  }

  removeLink(link: Link) {
    remove(this.links, link);
  }

  save() {

    this.persisting = true;

    const orgIds = this.contributors.map(o => o.id.uuid);
    const classificationIds = this.classifications.map(c => c.identifier);

    this.modelService.newModel(this.prefix, this.label, classificationIds, orgIds, this.languages, this.type)
      .then(model => {
        // XXX: should comment go to model creator api?
        model.comment = { [this.languages[0]]: this.comment };
        model.useContext = this.useContext;
        model.contact = this.contact;
        this.vocabularies.forEach(v => model.addVocabulary(v));
        this.referenceDatas.forEach(r => model.addReferenceData(r));
        this.importedNamespaces.forEach(ns => model.addImportedNamespace(ns));
        this.links.forEach(l => model.addLink(l));
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
