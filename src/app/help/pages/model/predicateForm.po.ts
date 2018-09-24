import { createStory, createExpectedStateNextCondition } from 'app/help/contract';
import { KnownPredicateType } from 'app/types/entity';
import { upperCaseFirst } from 'change-case';
import { editableByTitle, input, editableFocus, editableMargin } from 'app/help/utils/selector';
import { initialInputValue } from 'app/help/utils/init';
import { validInput } from 'app/help/utils/condition';

export function enterPredicateLabel(parent: () => JQuery, type: KnownPredicateType, initialValue: string) {

  const title = upperCaseFirst(type) + ' label';
  const enterPredicateLabelElement = editableByTitle(parent, title);
  const enterPredicateLabelInputElement = input(enterPredicateLabelElement);

  return createStory({

    title: { key: title },
    content: { key: title + ' info' },
    popover: { element: enterPredicateLabelInputElement, position: 'left-down' },
    focus: { element: editableFocus(enterPredicateLabelElement), margin: editableMargin },
    nextCondition: createExpectedStateNextCondition(validInput(enterPredicateLabelInputElement)),
    reversible: true,
    initialize: initialInputValue(enterPredicateLabelInputElement, initialValue)
  });
}
