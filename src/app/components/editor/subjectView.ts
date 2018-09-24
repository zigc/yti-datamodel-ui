import { SearchConceptModal } from './searchConceptModal';
import { Class } from 'app/entities/class';
import { Predicate } from 'app/entities/predicate';
import { Model } from 'app/entities/model';
import { LegacyComponent, modalCancelHandler } from 'app/utils/angular';
import { ConfigService } from 'app/services/configService';
import { Config } from 'app/entities/config';
import { EditableForm } from 'app/components/form/editableEntityController';

@LegacyComponent({
  bindings: {
    entity: '=',
    model: '='
  },
  require: {
    form: '?^form'
  },
  template: require('./subjectView.html')
})
export class SubjectViewComponent {

  entity: Class|Predicate;
  model: Model;
  config: Config;
  form: EditableForm;

  constructor(private searchConceptModal: SearchConceptModal,
              private configService: ConfigService) {
    'ngInject';
    this.configService.getConfig().then(urlConfig => {
      this.config = urlConfig;
    });
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  get conceptLink() {
    return this.config && this.config.conceptUrl(this.entity.subject);
  }

  changeSubject() {

    const normalizedType = this.entity.normalizedType;

    if (normalizedType === 'property') {
      throw new Error('Must be known predicate type');
    }

    this.searchConceptModal.openSelection(this.model.vocabularies, this.model, true, normalizedType)
      .then(concept => this.entity.subject = concept, modalCancelHandler);
  }
}
