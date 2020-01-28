import { LegacyComponent } from 'app/utils/angular';
import { EditableForm } from 'app/components/form/editableEntityController';
import { Model } from 'app/entities/model';

@LegacyComponent({
  bindings: {
    model: '<',
    saveNewVersion: '&',
    close: '&'
  },
  template: `
    <div class="modal-header">
      <h4 class="modal-title strong">
        <a><i id="close_modal_link" class="fa fa-times" ng-click="$ctrl.close()"></i></a>
        <span translate>Create new version of datamodel</span>
      </h4>
    </div>
    <div class="modal-body">
      <form name="$ctrl.form" class="editable-form" implicit-edit-mode>
          <p translate>Define prefix for the new version. Note that prefix is used to define the new namespace.</p>
          <editable data-title="Prefix" context="$ctrl.model.context">
            <input id="new_datamodel_version_prefix_input" class="form-control" type="text" prefix-input
                    reserved-prefixes-getter="$ctrl.importedPrefixes"
                    is-model-prefix='true'
                    ng-model="$ctrl.prefix"
                    autocomplete="off"
                    required />
          </editable>
      </form>
    </div>
    <div class="modal-footer">
      <div>
        <button id="save_new_datamodel_version_button"
                ng-disabled="!$ctrl.canSave()"
                type="button"
                class="btn btn-action"
                ng-click="$ctrl.saveNewVersion($ctrl.prefix)"
                translate>Save</button>
        <button id="cancel_new_datamodel_version_button" type="button" class="btn btn-link" ng-click="$ctrl.close()" translate>Cancel</button>
      </div>
    </div>
  `
})
export class NewDatamodelVersionPrefixModalFormComponent {

  model: Model;
  saveNewVersion: (prefix: string) => void;
  close: () => void;

  importedPrefixes: () => string[];
  form: EditableForm;

  constructor() {

    this.importedPrefixes = () => {
      if (this.model.importedNamespaces) {
        return this.model.importedNamespaces.map(ns => ns.prefix);
      }
      return [];
    }
  }

  canSave() {
    return this.form.$valid;
  }
}
