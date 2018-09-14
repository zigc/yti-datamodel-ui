import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    editableController: '=',
    model: '='
  },
  transclude: {
    'content': 'selectionContent',
    'buttons': '?selectionButtons'
  },
  template: require('./selectionView.html')
})
export class SelectionViewComponent {
}
