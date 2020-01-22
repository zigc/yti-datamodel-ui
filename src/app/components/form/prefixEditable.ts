import { LegacyComponent } from 'app/utils/angular';
import { LanguageContext } from 'app/types/language';
import { AlertModalService } from 'yti-common-ui/components/alert-modal.component';
import { ModelService } from 'app/services/modelService';
import { TranslateService } from '@ngx-translate/core';
import { Model } from 'app/entities/model';
// import { EditableForm } from 'app/components/form/editableEntityController';

@LegacyComponent({
  bindings: {
    model: '<',
    prefix: '=',
    title: '@',
    context: '<',
  },
  // require: {
  //   form: '?^form'
  // },
  template: `
    <form name="form" class="editable-form" implicit-edit-mode>
      <editable data-title="Prefix" context="$ctrl.context">
        <input id="modelPrefix" class="form-control" type="text" prefix-input
                reserved-prefixes-getter="$ctrl.importedPrefixes"
                ng-model="$ctrl.prefix"
                autocomplete="off"
                required />
      </editable>

      <button id="save_new_version_button"
              ng-disabled="!$ctrl.canSave()"
              type="button"
              class="btn btn-action"
              ng-click="$ctrl.saveNewVersion()"
              translate>Save</button>
    </form>
  `
})
export class PrefixEditableComponent {

  // NEXT:
  // - Muuta tämä komponentti nimeltään kuvaamaan koko formia.
  // - Päämodaalin sulkeutuminen kun täällä klikkaa tallenna. Auttaisiko jokin output-funktio, joka annetaan päämodaalista tänne?

  // Poista näistä ja inputeista turhat!
  model: Model;
  prefix: string;
  title: string;
  context: LanguageContext;

  // form: EditableForm;

  constructor(private modelService: ModelService,
              private alertModalService: AlertModalService,
              private translateService: TranslateService) {
    'ngInject';
  }

  importedPrefixes() {
    return [];
  }

  canSave() {
    // TODO
    return true;
  }

  saveNewVersion() {
    const modalRef = this.alertModalService.open('CREATING_NEW_MODEL_VERSION_MESSAGE');

    modalRef.message = 'Prefix: ' + this.prefix;

    this.modelService.createNewModelVersion(this.prefix, this.model.id.uri).then(newUri => {

      modalRef.message = this.translateService.instant('New version of datamodel is created') +  ': ' + newUri;

      modalRef.showOkButton = true;
      // this.modal.close(false);
    }, error => {
      // this.uploading = false;
      // this.errorModalService.openSubmitError(error);
      modalRef.cancel();
    });
  };
}
