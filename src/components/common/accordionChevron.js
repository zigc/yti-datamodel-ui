module.exports = function directive() {
  return {
    restrict: 'EA',
    scope: {
      isOpen: '=',
      noPull: '=?'
    },
    transclude: true,
    template: `<ng-transclude></ng-transclude><span ng-class="['glyphicon', {'pull-right': !noPull,'glyphicon-chevron-down': isOpen, 'glyphicon-chevron-right': !isOpen}]"></span>`,
    require: '^uibAccordionGroup'
  };
};
