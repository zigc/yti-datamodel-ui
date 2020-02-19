import { SearchClassModal } from './searchClassModal';
import { SearchClassType } from 'app/types/component';
import { combineExclusions, createClassTypeExclusion, createDefinedByExclusion, createExistsExclusion, createSelfExclusion } from 'app/utils/exclusion';
import { collectProperties } from 'yti-common-ui/utils/array';
import { Class, ClassListItem, Constraint, ConstraintListItem } from 'app/entities/class';
import { Model } from 'app/entities/model';
import { ConstraintType } from 'app/types/entity';
import { LegacyComponent, modalCancelHandler } from 'app/utils/angular';
import { EditableForm } from 'app/components/form/editableEntityController';
import { isExternalLink } from 'app/components/form/href';

@LegacyComponent({
  bindings: {
    id: '@',
    constraint: '=',
    model: '=',
    class: '='
  },
  require: {
    form: '?^form'
  },
  template: require('./editableConstraint.html')
})
export class EditableConstraintComponent {

  constraint: Constraint;
  model: Model;
  class: Class;
  types: ConstraintType[] = ['or', 'and', 'not'];

  form: EditableForm;

  constructor(private searchClassModal: SearchClassModal) {
    'ngInject';
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  linkItem(item: ConstraintListItem) {
    return this.model.linkToResource(item.shapeId);
  }

  addItem() {
    const exclude = combineExclusions<ClassListItem>(
      createClassTypeExclusion(SearchClassType.SpecializedClass),
      createExistsExclusion(collectProperties(this.constraint.items, item => item.shapeId.uri)),
      createDefinedByExclusion(this.model),
      createSelfExclusion(this.class)
    );

    this.searchClassModal.openWithOnlySelection(this.model, true, exclude).then(klass => this.constraint.addItem(klass), modalCancelHandler);
  }

  removeItem(item: ConstraintListItem) {
    this.constraint.removeItem(item);
  }

  isExternalLink(link: string): boolean {
    return isExternalLink(link);
  }
}
