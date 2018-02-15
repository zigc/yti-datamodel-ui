import { module as mod } from './module';

mod.directive('selectionView', () => {
  return {
    scope: {
      editableController: '=',
      model: '='
    },
    restrict: 'E',
    template: require('./selectionView.html'),
    transclude: {
      'content': 'selectionContent',
      'buttons': '?selectionButtons'
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller: SelectionViewController
  };
});

class SelectionViewController {

}
