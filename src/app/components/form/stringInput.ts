import { IAttributes, INgModelController, IScope } from 'angular';
import { isValidIdentifier, isValidLabelLength, isValidModelLabelLength, isValidString } from './validators';
import { DirectiveDeclaration } from 'app/utils/angular';

interface StringInputAttributes extends IAttributes {
  stringInput: string;
}

export const StringInputDirective: DirectiveDeclaration = {
  selector: 'stringInput',
  factory() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link(_$scope: IScope, _element: JQuery, attributes: StringInputAttributes, ngModel: INgModelController) {
        ngModel.$validators['string'] = isValidString;

        if (attributes.stringInput) {
          switch (attributes.stringInput) {
            case 'label':
              ngModel.$validators['length'] = isValidLabelLength;
              break;
            case 'modelLabel':
              ngModel.$validators['length'] = isValidModelLabelLength;
              break;
            case 'identifier':
              ngModel.$validators['id'] = isValidIdentifier;
              break;
            default:
              throw new Error('Unsupported input type');
          }
        }
      }
    };
  }
};
