import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { EditableForm } from 'app/components/form/editableEntityController';
import { DataType, dataTypes } from 'app/entities/dataTypes';
import { LegacyComponent } from 'app/utils/angular';
import { INgModelController } from 'angular';

@LegacyComponent({
  bindings: {
    range: '=',
    id: '@'
  },
  require: {
    form: '?^form'
  },
  template: `
      <div class="editable-wrap form-group">
        <editable-label data-title="'Range'" input-id="$ctrl.id" required="true"></editable-label>
        
        <div ng-show="$ctrl.isEditing()">
          <localized-select id="{{$ctrl.id}}" values="$ctrl.ranges" value="$ctrl.range" display-name-formatter="$ctrl.displayNameFormatter"></localized-select>
        </div>
      
        <div ng-if="!ctrl.isEditing()" class="content">
          <span>{{$ctrl.displayName}}</span>
        </div>
        
        <error-messages ng-model-controller="$ctrl.inputNgModelCtrl"></error-messages>
      </div>
  `
})
export class EditableRangeSelectComponent {

  range: DataType;
  ranges: DataType[] = dataTypes;
  inputNgModelCtrl: INgModelController;
  displayNameFormatter = (value: string, gettextCatalog: GettextCatalog) => value ? `${gettextCatalog.getString(value)} (${value})` : '';

  form: EditableForm;

  constructor(private gettextCatalog: GettextCatalog,
              private $element: JQuery) {
    'ngInject';
  }

  $postLink() {
    const input = this.$element.find('[ng-model]');
    this.inputNgModelCtrl = input.controller('ngModel');
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  get displayName() {
    return this.range ? this.displayNameFormatter(this.range, this.gettextCatalog) : '';
  }
}
