import { IScope } from 'angular';
import { LanguageService, Localizer } from 'app/services/languageService';
import { ColumnDescriptor, TableDescriptor } from 'app/components/form/editableTable';
import { createExistsExclusion } from 'app/utils/exclusion';
import { collectIds } from 'app/utils/entity';
import { SearchReferenceDataModal } from './searchReferenceDataModal';
import { EditReferenceDataModal } from './editReferenceDataModal';
import { ViewReferenceDataModal } from './viewReferenceDataModal';
import { ReferenceData } from 'app/entities/referenceData';
import { LegacyComponent, modalCancelHandler } from 'app/utils/angular';
import { LanguageContext } from 'app/types/language';
import { EditableForm } from 'app/components/form/editableEntityController';

interface WithReferenceDatas {
  referenceDatas: ReferenceData[];
  addReferenceData(referenceData: ReferenceData): void;
  removeReferenceData(referenceData: ReferenceData): void;
}

@LegacyComponent({
  bindings: {
    value: '=',
    context: '='
  },
  require: {
    form: '?^form'
  },
  template: `
      <h4>
        <span translate>Reference data</span> 
        <button id="add_reference_data_button" type="button" class="btn btn-link btn-xs pull-right" ng-click="$ctrl.addReferenceData()" ng-show="$ctrl.isEditing()">
          <span translate>Add reference data</span>
        </button>
      </h4>
      <editable-table id="'referenceData'" descriptor="$ctrl.descriptor" expanded="$ctrl.expanded"></editable-table>
  `
})
export class ReferenceDatasViewComponent {

  value: WithReferenceDatas;
  context: LanguageContext;

  descriptor: ReferenceDataTableDescriptor;
  expanded: boolean;

  form: EditableForm;

  constructor(private $scope: IScope,
              private searchReferenceDataModal: SearchReferenceDataModal,
              private editReferenceDataModal: EditReferenceDataModal,
              private viewReferenceDataModal: ViewReferenceDataModal,
              private languageService: LanguageService) {
    'ngInject';
  }

  $onInit() {
    this.$scope.$watch(() => this.value, value => {
      this.descriptor = new ReferenceDataTableDescriptor(value, this.context, this.editReferenceDataModal, this.viewReferenceDataModal, this.languageService);
    });
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  addReferenceData() {

    const exclude = createExistsExclusion(collectIds(this.value.referenceDatas));

    this.searchReferenceDataModal.openSelectionForModel(this.context, exclude)
      .then(referenceData => {
        this.value.addReferenceData(referenceData);
        this.expanded = true;
      }, modalCancelHandler);
  }
}

class ReferenceDataTableDescriptor extends TableDescriptor<ReferenceData> {

  private localizer: Localizer;

  constructor(private value: WithReferenceDatas,
              public context: LanguageContext,
              private editReferenceDataModal: EditReferenceDataModal,
              private viewReferenceDataModal: ViewReferenceDataModal,
              private languageService: LanguageService) {
    super();
    this.localizer = this.languageService.createLocalizer(this.context);
  }

  columnDescriptors(): ColumnDescriptor<ReferenceData>[] {

    const clickHandler = (value: ReferenceData) => {
      if (value.isExternal()) {
        window.open(value.id.uri, '_blank');
      } else {
        this.viewReferenceDataModal.open(value, this.context);
      }
    };

    return [
      { headerName: 'Reference data name', nameExtractor: referenceData => this.localizer.translate(referenceData.title), onClick: clickHandler },
      { headerName: 'Description', nameExtractor: referenceData => this.localizer.translate(referenceData.description) }
    ];
  }

  values(): ReferenceData[] {
    return this.value && this.value.referenceDatas;
  }

  canEdit(referenceData: ReferenceData): boolean {
    return referenceData.isExternal();
  }

  edit(value: ReferenceData): any {
    this.editReferenceDataModal.openEdit(value, this.context, this.localizer.language);
  }

  canRemove(_referenceData: ReferenceData): boolean {
    return true;
  }

  remove(referenceData: ReferenceData): any {
    this.value.removeReferenceData(referenceData);
  }

  orderBy(referenceData: ReferenceData): any {
    return referenceData.identifier;
  }
}
