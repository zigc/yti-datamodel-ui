import { searchResult, child, nth, first } from 'app/help/selectors';
import {
  createStory, createModifyingClickNextCondition,
  createClickNextCondition, createExplicitNextCondition, createExpectedStateNextCondition, createScrollWithElement
} from 'app/help/contract';
import { initialInputValue, elementExists, inputHasExactValue, expectAll, formatSearch } from 'app/help/utils';

export const textSearchElement = (modalParent: () => JQuery) => child(modalParent, 'text-filter input');
export const searchSelectionElement = (modalParent: () => JQuery) => child(modalParent, '.search-selection');
export const searchResultsElement = (modalParent: () => JQuery) => child(modalParent, '.search-results');

const searchResultPostfix = '_search_result_link';

export function filterForSearchResult(modalParent: () => JQuery, name: string, expectedResultId: string, abbreviate: boolean) {

  const filterForSearchResultTextSearchElement = textSearchElement(modalParent);

  return createStory({

    title: { key: 'Search for', context: { name } },
    content: { key: 'Search for info', context: { name } },
    popover: { element: filterForSearchResultTextSearchElement, position: 'right-down' },
    focus: { element: filterForSearchResultTextSearchElement },
    nextCondition: createExpectedStateNextCondition(elementExists(searchResult(modalParent, expectedResultId + searchResultPostfix))),
    initialize: initialInputValue(filterForSearchResultTextSearchElement, formatSearch(name, abbreviate ? 4 : name.length)),
    reversible: true
  });
}

export function selectSearchResult(modalParent: () => JQuery, name: string, resultId: string, selectionNeedsConfirmation: boolean) {

  const selectResultElement = searchResult(modalParent, resultId + searchResultPostfix);

  return createStory({

    title: { key: 'Select search result', context: { name } },
    content: { key: 'Select search result info', context: { name } },
    scroll: createScrollWithElement(searchResultsElement(modalParent), selectResultElement),
    popover: { element: selectResultElement, position: 'right-down' },
    focus: { element: selectResultElement },
    nextCondition: selectionNeedsConfirmation ? createClickNextCondition(selectResultElement)
                                              : createModifyingClickNextCondition(selectResultElement),
    reversible: selectionNeedsConfirmation
  });
}

export function filterForAddNewResult(modalParent: () => JQuery, name: string, searchType: string, abbreviate: boolean) {

  const filterForAddNewElement = textSearchElement(modalParent);
  const addNewResultsElements = first(child(modalParent, '.search-result.add-new'));
  const initialSearch = formatSearch(name, abbreviate ? 4 : name.length);

  return createStory({

    title: { key: `Search for ${searchType}`, context: { name } },
    content: { key: `Search for ${searchType} info`, context: { name } },
    popover: { element: filterForAddNewElement, position: 'bottom-right' },
    focus: { element: filterForAddNewElement },
    nextCondition: createExpectedStateNextCondition(
      expectAll(
        inputHasExactValue(filterForAddNewElement, initialSearch),
        elementExists(addNewResultsElements)
      )
    ),
    initialize: initialInputValue(filterForAddNewElement, initialSearch),
    reversible: true
  });
}

export function selectAddNewResult(modalParent: () => JQuery, addNewIndex: number, title: string) {

  const selectAddNewSearchResultsElement = searchResultsElement(modalParent);
  const selectAddNewElement = nth(child(selectAddNewSearchResultsElement, '.search-result.add-new'), addNewIndex);

  return createStory({
    title: { key: title },
    content: { key: title + ' info' },
    scroll: createScrollWithElement(selectAddNewSearchResultsElement, selectAddNewElement),
    popover: { element: selectAddNewElement, position: 'right-down' },
    focus: { element: selectAddNewElement },
    nextCondition: createClickNextCondition(selectAddNewElement)
  });
}

export function focusSearchSelection(modalParent: () => JQuery, label: string, content?: string) {

  const focusSearchResultElement = searchSelectionElement(modalParent);

  return createStory({
    title: { key: label },
    content: content ? { key: content } : undefined,
    popover: { element: focusSearchResultElement, position: 'left-down' },
    focus: { element: focusSearchResultElement },
    denyInteraction: true,
    nextCondition: createExplicitNextCondition()
  });
}
