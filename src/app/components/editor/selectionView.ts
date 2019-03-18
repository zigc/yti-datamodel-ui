import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    editableController: '=',
    model: '=',
    idPrefix: '<'
  },
  transclude: {
    'content': 'selectionContent',
    'buttons': '?selectionButtons'
  },
  template: require('./selectionView.html')
})
export class SelectionViewComponent {
  idPrefix?: string;

  id(section: string): string | undefined {
    return this.idPrefix ? this.idPrefix + section : undefined;
  }
}
