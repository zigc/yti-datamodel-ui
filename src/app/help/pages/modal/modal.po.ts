import { createModifyingClickNextCondition, createStory, createNavigatingClickNextCondition } from 'app/help/contract';
import { child } from 'app/help/utils/selector';

export function confirm(parent: () => JQuery, navigates: boolean) {

  const confirmButtonElement = child(parent, 'button.confirm');

  return createStory({

    title: { key: 'Confirm selection' },
    content: { key: 'Confirm selection info' },
    popover: { element: confirmButtonElement, position: 'top-right' },
    focus: { element: confirmButtonElement },
    nextCondition: navigates ? createNavigatingClickNextCondition(confirmButtonElement)
                             : createModifyingClickNextCondition(confirmButtonElement)
  });
}
