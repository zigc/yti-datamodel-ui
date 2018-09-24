import { Property } from 'app/entities/class';
import { anyMatching, keepMatching } from 'yti-common-ui/utils/array';

export function initialInputValue(element: () => JQuery, value: string) {
  return () => {
    const initialInputNgModel = element().controller('ngModel');

    if (!initialInputNgModel) {
      return false;
    } else {
      initialInputNgModel.$setViewValue(value);
      initialInputNgModel.$render();
      return true;
    }
  };
}

export const isExpectedProperty = (expectedProperties: string[]) =>
  (property: Property) => anyMatching(expectedProperties, predicateUri => property.predicateId.uri === predicateUri);

export function onlyProperties(properties: Property[], expectedProperties: string[]) {
  keepMatching(properties, isExpectedProperty(expectedProperties));
}

export function formatSearch(name: string, length = 4) {
  return name.toLowerCase().substring(0, Math.min(length, name.length))
}
