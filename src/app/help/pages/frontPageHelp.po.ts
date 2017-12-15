import { child } from 'app/help/selectors';
import { createStory, createNavigatingClickNextCondition } from 'app/help/contract';

const browsePanel = () => angular.element('#browse-panel');
const selectGroupElement = child(browsePanel, '.selectable-panel__list');
export const selectGroup = createStory({

  title: 'Select group',
  content: 'Group is a categorization of interoperability descriptions to different fields and domains',
  popover: { element: selectGroupElement, position: 'left-down' },
  focus: { element: browsePanel },
  nextCondition: createNavigatingClickNextCondition(selectGroupElement, true)
});
