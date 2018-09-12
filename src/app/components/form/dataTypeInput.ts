import { IAttributes, INgModelController, IQService, IScope } from 'angular';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { resolveValidator } from './validators';
import { LanguageService } from 'app/services/languageService';
import { createAsyncValidators } from './codeValueInput';
import { ReferenceDataService } from 'app/services/referenceDataService';
import { isUpperCase } from 'change-case';
import { DataType } from 'app/entities/dataTypes';
import { ReferenceData } from 'app/entities/referenceData';
import { DirectiveDeclaration } from 'app/utils/angular';

export function placeholderText(dataType: DataType, gettextCatalog: GettextCatalog) {
  const validator = resolveValidator(dataType);
  const localization = gettextCatalog.getString(dataType);
  const placeholder = gettextCatalog.getString('Input') + ' ' + (isUpperCase(localization) ? localization : localization.toLowerCase()) + '...';
  return validator.format ? placeholder + ` (${validator.format})` : placeholder;
}

interface DatatypeInputScope extends IScope {
  datatypeInput: DataType;
  referenceData: ReferenceData[];
}

export const DataTypeInputDirective: DirectiveDeclaration = {
  selector: 'datatypeInput',
  factory($q: IQService, referenceDataService: ReferenceDataService, languageService: LanguageService, gettextCatalog: GettextCatalog) {
    'ngInject';
    return {
      restrict: 'EA',
      scope: {
        datatypeInput: '=',
        referenceData: '='
      },
      require: 'ngModel',
      link($scope: DatatypeInputScope, element: JQuery, _attributes: IAttributes, ngModel: INgModelController) {

        const setPlaceholder = () => element.attr('placeholder', placeholderText($scope.datatypeInput, gettextCatalog));

        $scope.$watch(() => languageService.UILanguage, setPlaceholder);

        function initializeDataType(dataType: DataType, oldDataType: DataType) {
          setPlaceholder();

          if (oldDataType) {
            delete ngModel.$validators[oldDataType];
            ngModel.$setValidity(oldDataType, true);
          }

          ngModel.$validators[dataType] = resolveValidator(dataType);
          ngModel.$validate();
        }

        function initializeReferenceData(referenceData: ReferenceData[]) {
          Object.assign(ngModel.$asyncValidators, createAsyncValidators($q, referenceData, referenceDataService));
          ngModel.$validate();
        }

        $scope.$watch(() => $scope.datatypeInput, initializeDataType);
        $scope.$watchCollection(() => $scope.referenceData, initializeReferenceData);
      }
    };
  }
};
