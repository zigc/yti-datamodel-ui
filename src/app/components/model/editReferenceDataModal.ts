import { ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { Uri } from 'app/entities/uri';
import { Language } from 'app/types/language';
import { Model } from 'app/entities/model';
import { ReferenceData } from 'app/entities/referenceData';
import { identity } from 'yti-common-ui/utils/object';
import { modalCancelHandler } from 'app/utils/angular';

export class EditReferenceDataModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(model: Model, lang: Language, referenceDataToEdit: ReferenceData) {
    this.$uibModal.open({
      template: require('./editReferenceDataModal.html'),
      size: 'sm',
      controller: EditReferenceDataModalController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        lang: () => lang,
        referenceDataToEdit: () => referenceDataToEdit
      }
    }).result.then(identity, modalCancelHandler);
  }

  openEdit(referenceData: ReferenceData, model: Model, lang: Language) {
    this.open(model, lang, referenceData);
  }
}

class EditReferenceDataModalController {

  id: Uri;
  title: string;
  description: string;

  cancel = this.$uibModalInstance.dismiss;

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, private lang: Language, public model: Model, private referenceDataToEdit: ReferenceData) {
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
}
