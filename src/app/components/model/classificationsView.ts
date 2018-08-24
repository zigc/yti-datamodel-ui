import { IAttributes, IScope } from 'angular';
import { LanguageService } from 'app/services/languageService';
import { ColumnDescriptor, TableDescriptor } from 'app/components/form/editableTable';
import { module as mod } from './module';
import { createExistsExclusion } from 'app/utils/exclusion';
import { collectProperties } from 'yti-common-ui/utils/array';
import { EditableForm } from '../form/editableEntityController';
import { Classification } from '../../entities/classification';
import { SearchClassificationModal } from './searchClassificationModal';
import { modalCancelHandler } from '../../utils/angular';

interface WithClassifications {
  classifications: Classification[];
  addClassification(classification: Classification): void;
  removeClassification(classification: Classification): void;
}

mod.directive('classificationsView', () => {
  return {
    scope: {
      value: '='
    },
    restrict: 'E',
    template: `
      <h4>
        <span translate>Classifications</span> 
        <button id="add_classification_button" type="button" class="btn btn-link btn-xs pull-right" ng-click="ctrl.addClassification()" ng-show="ctrl.isEditing()">
          <span translate>Add classification</span>
        </button>
      </h4>
      <editable-table id="'classifications'" descriptor="ctrl.descriptor" expanded="ctrl.expanded"></editable-table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['classificationsView', '?^form'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [thisController, formController]: [ClassificationsViewController, EditableForm]) {
      thisController.isEditing = () => formController && formController.editing;
    },
    controller: ClassificationsViewController
  };
});

class ClassificationsViewController {

  value: WithClassifications;
  isEditing: () => boolean;

  descriptor: ClassificationTableDescriptor;
  expanded: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              languageService: LanguageService,
              private searchClassificationModal: SearchClassificationModal) {

    $scope.$watch(() => this.value, value => {
      this.descriptor = new ClassificationTableDescriptor(value, languageService);
    });
  }

  addClassification() {

    const classificationIds = collectProperties(this.value.classifications, c => c.id.uri);
    const exclude = createExistsExclusion(classificationIds);

    this.searchClassificationModal.open(exclude)
      .then((classification: Classification) => {
        this.value.addClassification(classification);
        this.expanded = true;
      }, modalCancelHandler);
  }
}

class ClassificationTableDescriptor extends TableDescriptor<Classification> {

  constructor(private value: WithClassifications, private languageService: LanguageService) {
    super();
  }

  columnDescriptors(): ColumnDescriptor<Classification>[] {
    return [
      { headerName: 'Name', nameExtractor: c => this.languageService.translate(c.label) }
    ];
  }

  values(): Classification[] {
    return this.value && this.value.classifications;
  }

  canEdit(_classification: Classification): boolean {
    return false;
  }

  canRemove(classification: Classification): boolean {
    return this.value.classifications.length > 0;
  }

  remove(classification: Classification): any {
    this.value.removeClassification(classification);
  }

  orderBy(c: Classification) {
    return this.languageService.translate(c.label);
  }
}
