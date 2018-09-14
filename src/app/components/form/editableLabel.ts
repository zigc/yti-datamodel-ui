import { IScope } from 'angular';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { EditableForm } from './editableEntityController';
import { LanguageService } from 'app/services/languageService';
import { isLocalizationDefined } from 'app/utils/language';
import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    title: '=',
    inputId: '=',
    required: '='
  },
  require: {
    form: '?^form'
  },
  template: `
      <label>{{$ctrl.title | translate}} 
         <span ng-show="$ctrl.infoText" class="fas fa-info-circle info" uib-tooltip="{{$ctrl.infoText}}"></span>
         <span ng-show="$ctrl.required && $ctrl.isEditing()" class="fas fa-asterisk" uib-tooltip="{{'Required' | translate}}"></span>
      </label>
  `
})
export class EditableLabelComponent {

  title: string;
  inputId: string;
  infoText: string;

  form: EditableForm;

  constructor(private $scope: IScope,
              private $element: JQuery,
              private gettextCatalog: GettextCatalog,
              private languageService: LanguageService) {
    'ngInject';
  }

  $onInit() {

    const labelElement = this.$element.find('label');
    this.$scope.$watch(() => this.inputId, inputId => {
      if (inputId) {
        labelElement.attr('for', inputId);
      }
    });

    const key = this.title + ' info';

    this.$scope.$watch(() => this.languageService.UILanguage, () => {
      const infoText = this.gettextCatalog.getString(key);
      this.infoText = isLocalizationDefined(key, infoText) ? infoText : '';
    });
  }

  isEditing() {
    return this.form && this.form.editing;
  }
}
