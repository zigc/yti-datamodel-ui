import { getModelControllerFromInput } from './angular';

export function validInput(element: () => JQuery): () => boolean {
  return () => {
    const ngModel = getModelControllerFromInput(element());
    return ngModel.$valid && !ngModel.$pending
  };
}

export function inputHasExactValue(element: () => JQuery, value: string): () => boolean {
  return () => {
    const ngModel = getModelControllerFromInput(element());
    return ngModel.$viewValue === value;
  };
}

export function elementExists(element: () => JQuery): () => boolean {
  return () => {
    const e = element();
    return e && e.length > 0;
  };
}

export function expectAll(...expectations: (() => boolean)[]): () => boolean {
  return () => {
    for (const expectation of expectations) {
      if (!expectation()) {
        return false;
      }
    }
    return true;
  };
}
