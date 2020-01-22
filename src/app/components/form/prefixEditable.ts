import { LegacyComponent } from 'app/utils/angular';
import { LanguageContext } from 'app/types/language';
import { EditableForm } from 'app/components/form/editableEntityController';

@LegacyComponent({
  bindings: {
    prefix: '=',
    context: '<',
    saveNewVersion: '&'
  },
  // require: {
  //   form: '?^form'
  // },
  template: `
    <form name="$ctrl.form" class="editable-form" implicit-edit-mode>
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
              ng-click="$ctrl.saveNewVersion($ctrl.prefix)"
              translate>Save</button>
    </form>
  `
})
export class PrefixEditableComponent {

  // NEXT:
  // - Muuta tämä komponentti nimeltään kuvaamaan koko formia.
  // - Päämodaalin sulkeutuminen kun täällä klikkaa tallenna. Auttaisiko jokin output-funktio, joka annetaan päämodaalista tänne?

  // Poista näistä ja inputeista turhat!
  prefix: string;
  context: LanguageContext;
  saveNewVersion: () => void

  form: EditableForm;

  constructor() {
    'ngInject';
  }

  importedPrefixes() {
    return [];
  }

  canSave() {
    return this.form.$valid;
  }
}
