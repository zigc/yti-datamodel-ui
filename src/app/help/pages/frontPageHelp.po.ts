import { createStory, createClickNextCondition, Story, createNavigatingClickNextCondition } from 'app/help/contract';
import { KnownModelType } from '../../types/entity';
import { child } from '../selectors';

export function startModelCreation(type: KnownModelType): Story[] {

  const startModelCreationElement = () => angular.element(`#add-new-datamodel`);
  const startModelCreationButton = child(startModelCreationElement, `button.btn-action`);
  const dropdownSelectionElement = child(startModelCreationElement, `#add_${type}_button`);

  return [

    createStory({

      title: 'Add model',
      content: 'Add model description',
      popover: { element: startModelCreationButton, position: 'left-down' },
      focus: { element: startModelCreationButton },
      nextCondition: createClickNextCondition(startModelCreationButton)
    }),

    createStory({

      title: 'Add ' + type,
      content: 'Add ' + type + ' description',
      popover: { element: dropdownSelectionElement, position: 'left-down' },
      focus: { element: dropdownSelectionElement },
      nextCondition: createNavigatingClickNextCondition(dropdownSelectionElement)
    }),
  ];
}
