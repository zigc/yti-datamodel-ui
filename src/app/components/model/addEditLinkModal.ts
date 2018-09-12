import { IPromise } from 'angular';
import { IModalService, IModalServiceInstance } from 'angular-ui-bootstrap';
import { ModelService } from 'app/services/modelService';
import { Uri } from 'app/entities/uri';
import { Language } from 'app/types/language';
import { Link } from 'app/entities/model';

export class AddEditLinkModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  private open(lang: Language, linkToEdit: Link|null): IPromise<Link> {
    return this.$uibModal.open({
      template: require('./addEditLinkModal.html'),
      size: 'sm',
      controller: AddEditLinkModalController,
      controllerAs: '$ctrl',
      backdrop: true,
      resolve: {
        lang: () => lang,
        linkToEdit: () => linkToEdit
      }
    }).result;
  }

  openAdd(lang: Language): IPromise<Link> {
    return this.open(lang, null);
  }

  openEdit(link: Link, lang: Language): IPromise<Link> {
    return this.open(lang, link);
  }
}

class AddEditLinkModalController {

  title: string;
  description: string;
  homepage: Uri;
  edit: boolean;

  constructor(private $uibModalInstance: IModalServiceInstance,
              private modelService: ModelService,
              private lang: Language,
              private linkToEdit: Link|null) {
    'ngInject';
    this.edit = !!linkToEdit;

    if (linkToEdit) {
      this.title = linkToEdit.title[lang];
      this.description = linkToEdit.description[lang];
      this.homepage = linkToEdit.homepage;
    }
  }

  get confirmLabel() {
    return this.edit ? 'Edit' : 'Create new';
  }

  get titleLabel() {
    return this.edit ? 'Edit link' : 'Add link';
  }

  create() {
    if (this.edit) {
      this.linkToEdit!.title[this.lang] = this.title;
      this.linkToEdit!.description[this.lang] = this.description;
      this.linkToEdit!.homepage = this.homepage;

      this.$uibModalInstance.close(this.linkToEdit);
    } else {
      this.modelService.newLink(this.title, this.description, this.homepage, this.lang)
        .then(link => this.$uibModalInstance.close(link));
    }
  }

  cancel() {
    this.$uibModalInstance.dismiss('cancel');
  }
}
