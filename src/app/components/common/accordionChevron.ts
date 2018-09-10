import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const AccordionChevronComponent: ComponentDeclaration = {
  selector: 'accordionChevron',
  bindings: {
    isOpen: '=',
    noPull: '=?'
  },
  transclude: true,
  template: `<ng-transclude></ng-transclude><span ng-class="['fas', {'pull-right': !$ctrl.noPull,'fa-angle-down': $ctrl.isOpen, 'fa-angle-right': !$ctrl.isOpen}]"></span>`,
  controller: forwardRef(() => AccordionChevronController)
};

class AccordionChevronController {

  isOpen: boolean;
  noPull: boolean;
}
