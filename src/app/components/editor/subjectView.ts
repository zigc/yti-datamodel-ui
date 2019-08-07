import { SearchConceptModal } from './searchConceptModal';
import { Class } from '../../entities/class';
import { Predicate } from '../../entities/predicate';
import { Model } from '../../entities/model';
import { LegacyComponent, modalCancelHandler } from '../../utils/angular';
import { ConfigService } from '../../services/configService';
import { Config } from '../../entities/config';
import { EditableForm } from '../../components/form/editableEntityController';

@LegacyComponent({
  bindings: {
    id: '@',
    entity: '=',
    model: '=',
    changeConceptDisabled: '='
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
  changeConceptDisabled: Boolean;

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

  showChangeSubject() {
    return this.isEditing() && !this.changeConceptDisabled;
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
