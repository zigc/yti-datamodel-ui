import { IAttributes, IDirectiveFactory, INgModelController, IQService, IScope } from 'angular';
import { ValidatorService } from 'app/services/validatorService';
import { isValidClassIdentifier, isValidIdentifier, isValidLabelLength, isValidPredicateIdentifier } from './validators';
import { Uri } from 'app/entities/uri';
import { Class } from 'app/entities/class';
import { Predicate } from 'app/entities/predicate';
import { extendNgModelOptions } from 'app/utils/angular';

interface IdInputAttributes extends IAttributes {
  idInput: 'class' | 'predicate';
}

interface IdInputScope extends IScope {
  old: Class|Predicate;
}

export const IdInputDirective: IDirectiveFactory = ($q: IQService,
                                                    validatorService: ValidatorService) => {
  'ngInject';
  return {
    scope: {
      old: '='
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: IdInputScope, _element: JQuery, attributes: IdInputAttributes, modelController: INgModelController) {
      let previous: Uri|null = null;

      extendNgModelOptions(modelController, {
        updateOnDefault: true,
        updateOn: 'blur default',
        debounce: {
          'blur': 0,
          'default': 1000
        }
      });

      modelController.$parsers.push((value: string) => {
        // doesn't handle scenario without initial Uri
        return previous ? previous.withName(value) : null;
      });

      modelController.$formatters.push((value: Uri) => {
        if (value) {
          previous = value;
          return value.name;
        } else {
          return undefined;
        }
      });

      modelController.$asyncValidators['existingId'] = (modelValue: Uri) => {
        if ($scope.old.unsaved || $scope.old.id.notEquals(modelValue)) {
          if (attributes.idInput === 'class') {
            return validatorService.classDoesNotExist(modelValue);
          } else if (attributes.idInput === 'predicate') {
            return validatorService.predicateDoesNotExist(modelValue);
          } else {
            throw new Error('Unknown type: ' + attributes.idInput);
          }
        } else {
          return $q.when(true);
        }
      };

      modelController.$validators['id'] = value => {
        if (value) {
          try {
            const name = value.name;
            if (attributes.idInput === 'class') {
              return isValidClassIdentifier(name, attributes.idInput);
            } else if (attributes.idInput === 'predicate') {
              return isValidPredicateIdentifier(name, attributes.idInput);
            } else {
              return isValidIdentifier(name, attributes.idInput);
            }
          } catch (e) {
            // probably value.name getter failed
          }
        }
        return false;
      };

      modelController.$validators['length'] = value => {
        try {
          return value && isValidLabelLength(value.name);
        } catch (e) {
          // probably value.name getter failed
        }
        return true; // NOTE: length error is probably not the one needed here
      };
    }
  };
};
