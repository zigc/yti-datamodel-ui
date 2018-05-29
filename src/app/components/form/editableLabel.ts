import { IAttributes, IScope } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;
import { EditableForm } from './editableEntityController';
import { LanguageService } from 'app/services/languageService';
import { isLocalizationDefined } from 'app/utils/language';
import { module as mod } from './module';

mod.directive('editableLabel', () => {
  return {
    scope: {
      title: '=',
      inputId: '=',
      required: '='
    },
    restrict: 'E',
    template: `<label>{{ctrl.title | translate}} 
                  <span ng-show="ctrl.infoText" class="fas fa-info-circle info" uib-tooltip="{{ctrl.infoText}}"></span>
                  <span ng-show="ctrl.required && ctrl.isEditing()" class="fas fa-asterisk" uib-tooltip="{{'Required' | translate}}"></span>
               </label>`,
    bindToController: true,
    controllerAs: 'ctrl',
    require: ['editableLabel', '?^form'],
    link($scope: IScope, element: JQuery, _attributes: IAttributes, [thisController, formController]: [EditableLabelController, EditableForm]) {
      thisController.isEditing = () => formController.editing;
      const labelElement = element.find('label');
      $scope.$watch(() => thisController.inputId, inputId => {
        if (inputId) {
          labelElement.attr('for', inputId);
        }
      });
    },
    controller: EditableLabelController
  };
});

class EditableLabelController {

  title: string;
  inputId: string;
  isEditing: () => boolean;
  infoText: string;

  /* @ngInject */
  constructor($scope: IScope, gettextCatalog: gettextCatalog, languageService: LanguageService) {
    const key = this.title + ' info';
    $scope.$watch(() => languageService.UILanguage, () => {
      const infoText = gettextCatalog.getString(key);
      this.infoText = isLocalizationDefined(key, infoText) ? infoText : '';
    });
  }
}
