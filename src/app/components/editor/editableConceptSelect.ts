import { module as mod } from './module';
import { SearchConceptModal } from './searchConceptModal';
import { EditableForm } from 'app/components/form/editableEntityController';
import { IScope, IAttributes } from 'angular';
import { Concept } from 'app/entities/vocabulary';
import { Model } from 'app/entities/model';
import { ClassType, KnownPredicateType } from 'app/types/entity';
import { modalCancelHandler } from 'app/utils/angular';

mod.directive('editableConceptSelect', () => {
  return {
    scope: {
      concept: '=',
      model: '=',
      title: '@',
      allowSuggestions: '=',
      type: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    restrict: 'E',
    template: require('./editableConceptSelect.html'),
    controller: EditableConceptSelectController,
    require: ['editableConceptSelect', '?^form'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [thisController, formController]: [EditableConceptSelectController, EditableForm]) {
      thisController.isEditing = () => formController && formController.editing;
    }
  };
});

class EditableConceptSelectController {

  concept: Concept|null;
  model: Model;
  title: string;
  allowSuggestions: boolean;
  type: ClassType|KnownPredicateType;

  isEditing: () => boolean;

  constructor(private searchConceptModal: SearchConceptModal) {
  }

  selectConcept() {
    this.searchConceptModal.openSelection(this.model.modelVocabularies, this.model, this.allowSuggestions, this.type)
      .then(concept => this.concept = concept, modalCancelHandler);
  }

  clearSelection() {
    this.concept = null;
  }
}
