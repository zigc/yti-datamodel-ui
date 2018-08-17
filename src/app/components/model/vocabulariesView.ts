import { IAttributes, IScope } from 'angular';
import { LanguageService } from 'app/services/languageService';
import { ColumnDescriptor, TableDescriptor } from 'app/components/form/editableTable';
import { SearchVocabularyModal } from './searchVocabularyModal';
import { module as mod } from './module';
import { createExistsExclusion } from 'app/utils/exclusion';
import { collectProperties } from 'yti-common-ui/utils/array';
import { Vocabulary } from 'app/entities/vocabulary';
import { modalCancelHandler } from 'app/utils/angular';
import { LanguageContext } from 'app/types/language';
import { EditableForm } from 'app/components/form/editableEntityController';

interface WithVocabularies {
  vocabularies: Vocabulary[];
  addVocabulary(vocabulary: Vocabulary): void;
  removeVocabulary(vocabulary: Vocabulary): void;
}

mod.directive('vocabulariesView', () => {
  return {
    scope: {
      value: '=',
      context: '='
    },
    restrict: 'E',
    template: `
      <h4>
        <span translate>Controlled vocabularies</span> 
        <button id="add_vocabulary_button" type="button" class="btn btn-link btn-xs pull-right" ng-click="ctrl.addVocabulary()" ng-show="ctrl.isEditing()">
          <span translate>Add vocabulary</span>
        </button>
      </h4>
      <editable-table id="'vocabularies'" descriptor="ctrl.descriptor" expanded="ctrl.expanded"></editable-table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['vocabulariesView', '?^form'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [thisController, formController]: [VocabulariesViewController, EditableForm]) {
      thisController.isEditing = () => formController && formController.editing;
    },
    controller: VocabulariesViewController
  };
});

class VocabulariesViewController {

  value: WithVocabularies;
  context: LanguageContext;
  isEditing: () => boolean;

  descriptor: VocabularyTableDescriptor;
  expanded: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              private searchVocabularyModal: SearchVocabularyModal,
              languageService: LanguageService) {

    $scope.$watch(() => this.value, value => {
      this.descriptor = new VocabularyTableDescriptor(value, this.context, languageService);
    });
  }

  addVocabulary() {
    const vocabularies = collectProperties(this.value.vocabularies, vocabulary => vocabulary.id.uri);
    const exclude = createExistsExclusion(vocabularies);

    this.searchVocabularyModal.open(this.context, exclude)
      .then((vocabulary: Vocabulary) => {
        this.value.addVocabulary(vocabulary);
        this.expanded = true;
      }, modalCancelHandler);
  }
}

class VocabularyTableDescriptor extends TableDescriptor<Vocabulary> {

  constructor(private value: WithVocabularies, private context: LanguageContext, private languageService: LanguageService) {
    super();
  }

  columnDescriptors(): ColumnDescriptor<Vocabulary>[] {
    return [
      { headerName: 'Vocabulary name', nameExtractor: vocabulary => this.languageService.translate(vocabulary.title, this.context)}
    ];
  }

  values(): Vocabulary[] {
    return this.value && this.value.vocabularies;
  }

  canEdit(_vocabulary: Vocabulary): boolean {
    return false;
  }

  canRemove(vocabulary: Vocabulary): boolean {
    return true;
  }

  remove(vocabulary: Vocabulary): any {
    this.value.removeVocabulary(vocabulary);
  }

  orderBy(vocabulary: Vocabulary): any {
    return vocabulary.id;
  }
}
