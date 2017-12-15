import { localizableContains } from './language';
import { isLocalizable } from './language';
import { Localizable } from 'yti-common-ui/types/localization';

export function valueContains(value: Localizable|string, searchString: string) {
  if (isLocalizable(value)) {
    return localizableContains(value, searchString);
  } else if (typeof value === 'string') {
    return value.toLocaleLowerCase().indexOf(searchString.toLowerCase()) !== -1;
  } else {
    throw new Error('Value must localizable or string: ' + value);
  }
}
