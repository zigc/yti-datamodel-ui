import { IScope } from 'angular';
import { EditableForm } from 'app/components/form/editableEntityController';
import { SearchReferenceDataModal } from 'app/components/model/searchReferenceDataModal';
import { ViewReferenceDataModal } from 'app/components/model/viewReferenceDataModal';
import { ColumnDescriptor, TableDescriptor } from 'app/components/form/editableTable';
import { LanguageService, Localizer } from 'app/services/languageService';
import { collectProperties, remove } from 'yti-common-ui/utils/array';
import { createExistsExclusion } from 'app/utils/exclusion';
import { ReferenceData } from 'app/entities/referenceData';
import { Model } from 'app/entities/model';
import { ComponentDeclaration, modalCancelHandler } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const EditableReferenceDataSelectComponent: ComponentDeclaration = {
  selector: 'editableReferenceDataSelect',
  bindings: {
    referenceData: '=',
    model: '='
  },
  require: {
    form: '?^form'
  },
  template: require('./editableReferenceDataSelect.html'),
  controller: forwardRef(() => EditableReferenceDataSelectController)
};

class EditableReferenceDataSelectController {

  referenceData: ReferenceData[];
  model: Model;
  expanded: boolean;
  descriptor: ReferenceDataTableDescriptor;

  form: EditableForm;

  constructor(private $scope: IScope,
              private searchReferenceDataModal: SearchReferenceDataModal,
              private languageService: LanguageService,
              private viewReferenceDataModal: ViewReferenceDataModal) {
    'ngInject';
  }

  $onInit() {
    this.$scope.$watch(() => this.referenceData, referenceData => {
      this.descriptor = new ReferenceDataTableDescriptor(referenceData, this.model, this.languageService.createLocalizer(this.model), this.viewReferenceDataModal);
    });
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  addReferenceData() {
    const exclude = createExistsExclusion(collectProperties(this.referenceData, rd => rd.id.uri));

    this.searchReferenceDataModal.openSelectionForProperty(this.model, exclude).then(referenceData => {
      this.expanded = true;
      this.referenceData.push(referenceData);
    }, modalCancelHandler);
  }
}

class ReferenceDataTableDescriptor extends TableDescriptor<ReferenceData> {

  constructor(private referenceData: ReferenceData[], private model: Model, private localizer: Localizer, private viewReferenceDataModal: ViewReferenceDataModal) {
    super();
  }

  columnDescriptors(): ColumnDescriptor<ReferenceData>[] {

    // TODO: shared logic with referenceDatasView.ts
    const clickHandler = (value: ReferenceData) => {
      if (value.isExternal()) {
        window.open(value.id.uri, '_blank');
      } else {
        this.viewReferenceDataModal.open(value, this.model);
      }
    };

    return [
      { headerName: 'Reference data name', nameExtractor: referenceData => this.localizer.translate(referenceData.title), onClick: clickHandler },
      { headerName: 'Description', nameExtractor: referenceData => this.localizer.translate(referenceData.description) }
    ];
  }

  values(): ReferenceData[] {
    return this.referenceData;
  }

  canEdit(_referenceData: ReferenceData): boolean {
    return false;
  }

  edit(_referenceData: ReferenceData): any {
    throw new Error('Edit unsupported');
  }

  remove(referenceData: ReferenceData): any {
    remove(this.values(), referenceData);
  }

  canRemove(_referenceData: ReferenceData): boolean {
    return true;
  }

  orderBy(referenceData: ReferenceData): any {
    return referenceData.identifier;
  }
}
