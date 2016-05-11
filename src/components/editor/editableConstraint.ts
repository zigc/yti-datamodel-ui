import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { EditableForm } from '../form/editableEntityController';
import {
  Model, Constraint, ConstraintListItem, ClassListItem,
  ConstraintType, Class
} from '../../services/entities';
import { SearchClassModal } from './searchClassModal';
import { RelativeUrl } from '../../services/uri';
import { SearchClassType } from '../contracts';
import {
  createClassTypeExclusion, createExistsExclusion, createDefinedByExclusion,
  createSelfExclusion, combineExclusions
} from '../../utils/exclusion';
import { collectProperties } from '../../utils/entity';
import { module as mod }  from './module';

mod.directive('editableConstraint', () => {
  return {
    scope: {
      constraint: '=',
      model: '=',
      class: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./editableConstraint.html'),
    require: ['editableConstraint', '?^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, formController]: [EditableConstraint, EditableForm]) {
      thisController.isEditing = () => formController.editing;
    },
    controller: EditableConstraint
  };
});

class EditableConstraint {

  constraint: Constraint;
  model: Model;
  class: Class;
  isEditing: () => boolean;
  types: ConstraintType[] = ['or', 'and', 'not'];

  /* @ngInject */
  constructor(private searchClassModal: SearchClassModal) {
  }

  linkItem(item: ConstraintListItem): RelativeUrl {
    return this.model.linkTo({ type: 'class', id: item.shapeId }, true);
  }

  addItem() {
    const exclude = combineExclusions<ClassListItem>(
      createClassTypeExclusion(SearchClassType.SpecializedClass),
      createExistsExclusion(collectProperties(this.constraint.items, item => item.shapeId.uri)),
      createDefinedByExclusion(this.model),
      createSelfExclusion(this.class)
    );

    this.searchClassModal.openWithOnlySelection(this.model, exclude).then(klass => this.constraint.addItem(klass));
  }

  removeItem(item: ConstraintListItem) {
    this.constraint.removeItem(item);
  }
}
