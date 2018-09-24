import { createStory, createClickNextCondition, Story, createNavigatingClickNextCondition } from 'app/help/contract';
import { KnownModelType } from 'app/types/entity';
import { child } from 'app/help/selectors';

export function startModelCreation(type: KnownModelType): Story[] {

  const startModelCreationElement = () => jQuery(`#add-new-datamodel`);
  const startModelCreationButton = child(startModelCreationElement, `button.btn-action`);
  const dropdownSelectionElement = child(startModelCreationElement, `#add_${type}_button`);

  return [

    createStory({

      title: { key: 'Add model' },
      content: { key: 'Add model description' },
      popover: { element: startModelCreationButton, position: 'left-down' },
      focus: { element: startModelCreationButton },
      nextCondition: createClickNextCondition(startModelCreationButton)
    }),

    createStory({

      title: { key: 'Add ' + type },
      content: { key: 'Add ' + type + ' description' },
      popover: { element: dropdownSelectionElement, position: 'left-down' },
      focus: { element: dropdownSelectionElement },
      nextCondition: createNavigatingClickNextCondition(dropdownSelectionElement)
    }),
  ];
}
