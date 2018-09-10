import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const SelectionViewComponent: ComponentDeclaration = {
  selector: 'selectionView',
  bindings: {
    editableController: '=',
    model: '='
  },
  transclude: {
    'content': 'selectionContent',
    'buttons': '?selectionButtons'
  },
  template: require('./selectionView.html'),
  controller: forwardRef(() => SelectionViewController)
};

class SelectionViewController {
}
