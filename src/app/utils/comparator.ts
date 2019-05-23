import { Moment } from 'moment';
import { Optional, isDefined } from 'yti-common-ui/utils/object';
import { ChainableComparator, makeChainable, optional, property, stringComparatorIgnoringCase, Comparator, primitiveComparator } from 'yti-common-ui/utils/comparator';
import { Localizer } from '../types/language';
import { Localizable } from 'yti-common-ui/types/localization';

export function comparingDate<T>(propertyExtractor: (item: T) => Optional<Moment>): ChainableComparator<T> {
  return makeChainable(property(propertyExtractor, optional(dateComparator)));
}
export function comparingDateAllowNull<T>(propertyExtractor: (item: T) => Optional<Moment>): ChainableComparator<T> {
  return makeChainable(property(propertyExtractor, optional(dateComparatorAllowNull)));
}

export function comparingLocalizable<T>(localizer: Localizer, propertyExtractor: (item: T) => Optional<Localizable>): ChainableComparator<T> {
  return makeChainable(property(propertyExtractor, optional(localized(localizer, stringComparatorIgnoringCase))));
}

function localized<T extends Localizable>(localizer: Localizer, localizedComparator: Comparator<string> = primitiveComparator): Comparator<T> {
  return (lhs: T, rhs: T) => localizedComparator(localizer.translate(lhs), localizer.translate(rhs));
}

export function dateComparator(lhs: Moment, rhs: Moment) {
  if (lhs.isAfter(rhs)) {
    return 1;
  } else if (lhs.isBefore(rhs)) {
    return -1;
  } else {
    return 0;
  }
}

export function dateComparatorAllowNull(lhs: Moment, rhs: Moment) {
    if (!isDefined(lhs)) {
    return 0;
  } else if (lhs.isAfter(rhs)) {
    return 1;
  } else if (lhs.isBefore(rhs)) {
    return -1;
  } else {
    return 0;
  }
}
