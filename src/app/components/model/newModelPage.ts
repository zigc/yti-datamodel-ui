import { IFormController, ILocationService } from 'angular';
import { module as mod } from './module';
import { ModelService } from 'app/services/modelService';
import { Uri } from 'app/entities/uri';
import { Language, LanguageContext } from 'app/types/language';
import { KnownModelType } from 'app/types/entity';
import { LocationService } from 'app/services/locationService';

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
  classifications = ['EDUC']; // FIXME
  organizations =  ['88ce73b9-376c-4ff1-8c51-e4159b0af75c']; // FIXME
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

  get namespace() {
    // TODO
    return 'http://todo/' + (this.prefix || '');
  }

  save() {

    this.persisting = true;

    this.modelService.newModel(this.prefix, this.label, this.classifications, this.organizations, this.languages, this.type)
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
