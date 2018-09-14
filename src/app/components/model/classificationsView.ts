import { IScope } from 'angular';
import { LanguageService } from 'app/services/languageService';
import { ColumnDescriptor, TableDescriptor } from 'app/components/form/editableTable';
import { createExistsExclusion } from 'app/utils/exclusion';
import { collectProperties } from 'yti-common-ui/utils/array';
import { EditableForm } from 'app/components/form/editableEntityController';
import { Classification } from 'app/entities/classification';
import { SearchClassificationModal } from './searchClassificationModal';
import { LegacyComponent, modalCancelHandler } from 'app/utils/angular';

interface WithClassifications {
  classifications: Classification[];
  addClassification(classification: Classification): void;
  removeClassification(classification: Classification): void;
}

@LegacyComponent({
  bindings: {
    value: '='
  },
  require: {
    form: '?^form'
  },
  template: `
      <h4>
        <span translate>Classifications</span> 
        <button id="add_classification_button" type="button" class="btn btn-link btn-xs pull-right" ng-click="$ctrl.addClassification()" ng-show="$ctrl.isEditing()">
          <span translate>Add classification</span>
        </button>
      </h4>
      <editable-table id="'classifications'" descriptor="$ctrl.descriptor" expanded="$ctrl.expanded"></editable-table>
  `
})
export class ClassificationsViewComponent {

  value: WithClassifications;

  descriptor: ClassificationTableDescriptor;
  expanded: boolean;

  form: EditableForm;

  constructor(private $scope: IScope,
              private languageService: LanguageService,
              private searchClassificationModal: SearchClassificationModal) {
    'ngInject';
  }

  $onInit() {
    this.$scope.$watch(() => this.value, value => {
      this.descriptor = new ClassificationTableDescriptor(value, this.languageService);
    });
  }

  isEditing() {
    return this.form && this.form.editing;
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
