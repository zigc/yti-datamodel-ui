import { IAttributes, IModelValidators, INgModelController, IScope } from 'angular';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { isValidLanguageCode } from './validators';
import { LanguageService } from 'app/services/languageService';
import { DirectiveDeclaration } from 'app/utils/angular';

export function placeholderText(gettextCatalog: GettextCatalog) {
  return gettextCatalog.getString('Input') + ' ' + gettextCatalog.getString('language code') + '...';
}

export function createValidators(): IModelValidators {
  return { languageCode: isValidLanguageCode };
}

export const LanguageInputDirective: DirectiveDeclaration = {
  selector: 'languageInput',
  /* @ngInject */
  factory(languageService: LanguageService, gettextCatalog: GettextCatalog) {
    return {
      scope: {
        model: '='
      },
      restrict: 'A',
      require: 'ngModel',
      link($scope: IScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {

        if (!attributes['placeholder']) {
          $scope.$watch(() => languageService.UILanguage, () => {
            element.attr('placeholder', placeholderText(gettextCatalog));
          });
        }

        const validators = createValidators();

        for (const validatorName of Object.keys(validators)) {
          modelController.$validators[validatorName] = validators[validatorName];
        }
      }
    };
  }
};
