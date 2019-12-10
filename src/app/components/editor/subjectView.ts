import { SearchConceptModal } from './searchConceptModal';
import { Class } from '../../entities/class';
import { Predicate } from '../../entities/predicate';
import { Model } from '../../entities/model';
import { LegacyComponent, modalCancelHandler } from '../../utils/angular';
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
  form: EditableForm;
  changeConceptDisabled: Boolean;

  constructor(private searchConceptModal: SearchConceptModal) {
    'ngInject';
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  showChangeSubject() {
    return this.isEditing() && !this.changeConceptDisabled;
  }

  get conceptLink() {
    return this.entity.subject ? this.entity.subject.id.uri : '';
  }

  get vocabularyLink() {
    return this.entity.subject ? this.entity.subject.vocabulary.id.uri : '';
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
