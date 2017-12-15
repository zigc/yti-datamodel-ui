import { SearchFilter, TextAnalysis } from '../types/filter';
import { limit, allMatching } from 'yti-common-ui/utils/array';

const defaultSearchLimit = 100;

export function applyFilters<T>(searchResults: TextAnalysis<T>[], filters: SearchFilter<T>[], limitResults = defaultSearchLimit) {
  return limit(searchResults.filter(results => allMatching(filters, filter => filter(results))), limitResults);
}
