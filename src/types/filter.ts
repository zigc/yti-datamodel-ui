import { AddNew } from '../components/common/searchResults';
import { Localizable } from 'yti-common-ui/types/localization';

export interface SearchController<T> {
  items: T[];
  searchResults: (AddNew|T)[];
  search(): void;
  addFilter(filter: SearchFilter<T>): void;
}

export type SearchFilter<T> = (analyzedItem: TextAnalysis<T>) => boolean;

export interface ContentMatcher<T> {
  name: string;
  extractor: ContentExtractor<T>;
}

export type ContentExtractor<T> = (item: T) => Localizable|string;

export interface TextAnalysis<T> {
  item: T;
  score: number;
  matchScore: number|null;
  search: string|null;
}
