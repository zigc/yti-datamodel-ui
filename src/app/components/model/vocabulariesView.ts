import { IAttributes, IScope } from 'angular';
import { ModelViewController } from './modelView';
import { LanguageService } from 'app/services/languageService';
import { ColumnDescriptor, TableDescriptor } from 'app/components/form/editableTable';
import { SearchVocabularyModal } from './searchVocabularyModal';
import { module as mod } from './module';
import { createExistsExclusion } from 'app/utils/exclusion';
import { collectProperties } from 'yti-common-ui/utils/array';
import { Model } from 'app/entities/model';
import { Vocabulary } from 'app/entities/vocabulary';
import { modalCancelHandler } from 'app/utils/angular';

mod.directive('vocabulariesView', () => {
  return {
    scope: {
      model: '='
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
    require: ['vocabulariesView', '?^modelView'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [thisController, modelViewController]: [VocabulariesViewController, ModelViewController]) {
      thisController.isEditing = () => modelViewController && modelViewController.isEditing();
    },
    controller: VocabulariesViewController
  };
});

class VocabulariesViewController {

  model: Model;
  isEditing: () => boolean;

  descriptor: VocabularyTableDescriptor;
  expanded: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              private searchVocabularyModal: SearchVocabularyModal,
              languageService: LanguageService) {

    $scope.$watch(() => this.model, model => {
      this.descriptor = new VocabularyTableDescriptor(model, languageService);
    });
  }

  addVocabulary() {
    const vocabularies = collectProperties(this.model.vocabularies, vocabulary => vocabulary.id.uri);
    const exclude = createExistsExclusion(vocabularies);

    this.searchVocabularyModal.open(this.model, exclude)
      .then((vocabulary: Vocabulary) => {
        this.model.addVocabulary(vocabulary);
        this.expanded = true;
      }, modalCancelHandler);
  }
}

class VocabularyTableDescriptor extends TableDescriptor<Vocabulary> {

  constructor(private model: Model, private languageService: LanguageService) {
    super();
  }

  columnDescriptors(): ColumnDescriptor<Vocabulary>[] {
    return [
      { headerName: 'Vocabulary name', nameExtractor: vocabulary => this.languageService.translate(vocabulary.title, this.model)}
    ];
  }

  values(): Vocabulary[] {
    return this.model && this.model.vocabularies;
  }

  canEdit(_vocabulary: Vocabulary): boolean {
    return false;
  }

  canRemove(vocabulary: Vocabulary): boolean {
    return true;
  }

  remove(vocabulary: Vocabulary): any {
    this.model.removeVocabulary(vocabulary);
  }

  orderBy(vocabulary: Vocabulary): any {
    return vocabulary.id;
  }
}
