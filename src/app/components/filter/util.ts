import { Localizer } from 'app/types/language';
import { Exclusion } from 'app/utils/exclusion';
import { ContentExtractor, SearchFilter, TextAnalysis } from 'app/types/filter';
import { analyze } from './textAnalyzer';
import { comparingLocalizable} from 'app/utils/comparator';
import { Comparator, comparingPrimitive } from 'yti-common-ui/utils/comparator';
import { allMatching, limit } from 'yti-common-ui/utils/array';
import { Localizable } from 'yti-common-ui/types/localization';

const defaultSearchLimit = 100;

export function applyFilters<T>(searchResults: TextAnalysis<T>[], filters: SearchFilter<T>[], limitResults = defaultSearchLimit) {
  return limit(searchResults.filter(results => allMatching(filters, filter => filter(results))), limitResults);
}


export function filterAndSortSearchResults<S>(items: S[],
                                              searchText: string,
                                              contentExtractors: ContentExtractor<S>[],
                                              filters: SearchFilter<S>[],
                                              comparator: Comparator<TextAnalysis<S>>): S[] {

  const analyzedItems = items.map(item => analyze(searchText, item, contentExtractors));
  const filteredAnalyzedItems = applyFilters(analyzedItems, filters);

  filteredAnalyzedItems.sort(comparator);

  return filteredAnalyzedItems.map(ai => ai.item);
}

export function scoreComparator<S>() {
  return comparingPrimitive<TextAnalysis<S>>(item => item.matchScore ? item.matchScore : item.score);
}

export function labelComparator<S extends { label: Localizable }>(localizer: Localizer) {
  return comparingLocalizable<TextAnalysis<S>>(localizer, item => item.item.label);
}

export function titleComparator<S extends { title: Localizable }>(localizer: Localizer) {
  return comparingLocalizable<TextAnalysis<S>>(localizer, item => item.item.title);
}

export function exclusionComparator<S>(exclude: Exclusion<S>) {
  return comparingPrimitive<TextAnalysis<S>>(item => !!exclude(item.item));
}

export function defaultLabelComparator<S extends { label: Localizable }>(localizer: Localizer, exclude?: Exclusion<S>) {
  const comparator = scoreComparator<S>().andThen(labelComparator<S>(localizer));
  return exclude ? exclusionComparator<S>(exclude).andThen(comparator) : comparator;
}

export function defaultTitleComparator<S extends { title: Localizable }>(localizer: Localizer, exclude?: Exclusion<S>) {
  const comparator = scoreComparator<S>().andThen(titleComparator<S>(localizer));
  return exclude ? exclusionComparator<S>(exclude).andThen(comparator) : comparator;
}
