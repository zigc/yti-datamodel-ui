import gettextCatalog = angular.gettext.gettextCatalog;
import { editableByTitle, editableFocus, input } from 'app/help/selectors';
import { createStory, createExpectedStateNextCondition } from 'app/help/contract';
import { editableMarginInColumn, validInput, initialInputValue } from 'app/help/utils';

export function enterModelComment(parent: () => JQuery, initialValue: string, gettextCatalog: gettextCatalog) {

  const title = 'Description';
  const enterModelCommentElement = editableByTitle(parent, title);
  const enterModelCommentInputElement = input(enterModelCommentElement);

  return createStory({

    title: title,
    content: title + ' info',
    popover: { element: enterModelCommentInputElement, position: 'right-down' },
    focus: { element: editableFocus(enterModelCommentElement), margin: editableMarginInColumn },
    nextCondition: createExpectedStateNextCondition(validInput(enterModelCommentInputElement)),
    reversible: true,
    initialize: initialInputValue(enterModelCommentInputElement, gettextCatalog.getString(initialValue))
  });
}
