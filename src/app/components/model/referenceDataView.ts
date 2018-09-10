import { IScope } from 'angular';
import { ReferenceDataService } from 'app/services/referenceDataService';
import { ViewReferenceDataModal } from './viewReferenceDataModal';
import { ReferenceData, ReferenceDataCode } from 'app/entities/referenceData';
import { LanguageContext } from 'app/types/language';
import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const ReferenceDataViewComponent: ComponentDeclaration = {
  selector: 'referenceDataView',
  bindings: {
    referenceData: '=',
    context: '=',
    title: '@',
    showCodes: '='
  },
  template: require('./referenceDataView.html'),
  controller: forwardRef(() => ReferenceDataViewController)
};

class ReferenceDataViewController {

  referenceData: ReferenceData;
  context: LanguageContext;
  title: string;
  showCodes: boolean;
  codes: ReferenceDataCode[];

  constructor(private $scope: IScope,
              private referenceDataService: ReferenceDataService,
              private viewReferenceDataModal: ViewReferenceDataModal) {
  }

  $onInit() {
    this.$scope.$watch(() => this.referenceData, referenceData => {
      if (referenceData && !referenceData.isExternal()) {
        this.referenceDataService.getReferenceDataCodes(referenceData)
          .then(values => this.codes = values);
      } else {
        this.codes = [];
      }
    });
  }

  browse() {
    if (this.referenceData.isExternal()) {
      window.open(this.referenceData.id.uri, '_blank');
    } else {
      this.viewReferenceDataModal.open(this.referenceData, this.context);
    }
  }
}
