import { createModifyingClickNextCondition, createStory, createNavigatingClickNextCondition } from 'app/help/contract';
import { child } from 'app/help/selectors';

export function confirm(parent: () => JQuery, navigates: boolean) {

  const confirmButtonElement = child(parent, 'button.confirm');

  return createStory({

    title: 'Confirm selection',
    content: 'Confirm selection info',
    popover: { element: confirmButtonElement, position: 'top-left' },
    focus: { element: confirmButtonElement },
    nextCondition: navigates ? createNavigatingClickNextCondition(confirmButtonElement)
                             : createModifyingClickNextCondition(confirmButtonElement)
  });
}
