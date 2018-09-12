import { IAsyncModelValidators, IAttributes, INgModelController, IQService, IScope } from 'angular';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { ReferenceDataService } from 'app/services/referenceDataService';
import { LanguageService } from 'app/services/languageService';
import { anyMatching } from 'yti-common-ui/utils/array';
import { ReferenceData } from 'app/entities/referenceData';
import { DirectiveDeclaration } from 'app/utils/angular';

export function placeholderText(gettextCatalog: GettextCatalog) {
  return gettextCatalog.getString('Write reference data code');
}

export function createAsyncValidators($q: IQService, referenceData: ReferenceData[], referenceDataService: ReferenceDataService): IAsyncModelValidators {

  const hasExternalReferenceData = anyMatching(referenceData, rd => rd.isExternal());

  return {
    codeValue(codeValue: string) {

      if (referenceData.length === 0 || hasExternalReferenceData || !codeValue) {
        return $q.resolve();
      } else {
        return referenceDataService.getReferenceDataCodes(referenceData).then(values => {
          for (const value of values) {
            if (value.identifier === codeValue) {
              return true;
            }
          }
          return $q.reject('does not match');
        });
      }
    }
  };
}

interface CodeValueInputScope extends IScope {
  referenceData: ReferenceData[];
}

export const CodeValueInputDirective: DirectiveDeclaration = {
  selector: 'codeValueInput',
  factory($q: IQService, referenceDataService: ReferenceDataService, languageService: LanguageService, gettextCatalog: GettextCatalog) {
    'ngInject';
    return {
      bindToController: {
        referenceData: '='
      },
      restrict: 'A',
      require: 'ngModel',
      link($scope: CodeValueInputScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {

        if (!attributes['placeholder']) {
          $scope.$watch(() => languageService.UILanguage, () => {
            element.attr('placeholder', placeholderText(gettextCatalog));
          });
        }

        $scope.$watch(() => $scope.referenceData, referenceData => {
          Object.assign(modelController.$asyncValidators, createAsyncValidators($q, referenceData, referenceDataService));
        });
      }
    }
  }
};

