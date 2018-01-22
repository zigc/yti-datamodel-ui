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
  classifications: Classification[] = [];
  contributors:  Organization[] = [];
  languages: Language[] = ['fi', 'en'];
  type: KnownModelType;

  context: LanguageContext = {
    id: new Uri('http://newModel', {}),
    language: this.languages
  };

  persisting = false;
  form: EditableForm;

  /* @ngInject */
  constructor(private $location: ILocationService,
              private modelService: ModelService,
              locationService: LocationService) {

    locationService.atNewModel(this.type);
  }

  $postLink() {
    this.form.editing = true;
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

  save() {

    this.persisting = true;

    const orgIds = this.contributors.map(o => o.id.uuid);
    const classificationIds = this.classifications.map(c => c.identifier);

    this.modelService.newModel(this.prefix, this.label, classificationIds, orgIds, this.languages, this.type)
      .then(model => {
        this.modelService.createModel(model).then(() => {
          this.$location.url(model.iowUrl());
        }, () => this.persisting = false);
      });
  }

  cancel() {
    this.$location.url('/');
  }
}
