import { IModalService, IModalServiceInstance } from 'angular-ui-bootstrap';
import { Uri } from 'app/entities/uri';
import { Language, LanguageContext } from 'app/types/language';
import { ReferenceData } from 'app/entities/referenceData';
import { identity } from 'yti-common-ui/utils/object';
import { modalCancelHandler } from 'app/utils/angular';

export class EditReferenceDataModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  private open(context: LanguageContext, lang: Language, referenceDataToEdit: ReferenceData) {
    this.$uibModal.open({
      template: require('./editReferenceDataModal.html'),
      size: 'sm',
      controller: EditReferenceDataModalController,
      controllerAs: '$ctrl',
      backdrop: true,
      resolve: {
        context: () => context,
        lang: () => lang,
        referenceDataToEdit: () => referenceDataToEdit
      }
    }).result.then(identity, modalCancelHandler);
  }

  openEdit(referenceData: ReferenceData, context: LanguageContext, lang: Language) {
    this.open(context, lang, referenceData);
  }
}

class EditReferenceDataModalController {

  id: Uri;
  title: string;
  description: string;

  constructor(private $uibModalInstance: IModalServiceInstance,
              private lang: Language,
              public context: LanguageContext,
              private referenceDataToEdit: ReferenceData) {
    'ngInject';
    this.id = referenceDataToEdit.id;
    this.title = referenceDataToEdit.title[lang];
    this.description = referenceDataToEdit.description[lang];
  }

  create() {
    this.referenceDataToEdit.id = this.id;
    this.referenceDataToEdit.title[this.lang] = this.title;
    this.referenceDataToEdit.description[this.lang] = this.description;

    this.$uibModalInstance.close(this.referenceDataToEdit);
  }

  cancel() {
    this.$uibModalInstance.dismiss('cancel');
  }
}
