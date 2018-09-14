import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    isOpen: '=',
    noPull: '=?'
  },
  transclude: true,
  template: `<ng-transclude></ng-transclude><span ng-class="['fas', {'pull-right': !$ctrl.noPull,'fa-angle-down': $ctrl.isOpen, 'fa-angle-right': !$ctrl.isOpen}]"></span>`,
})
export class AccordionChevronComponent {

  isOpen: boolean;
  noPull: boolean;
}
