 import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const ErrorPanelComponent: ComponentDeclaration = {
  selector: 'errorPanel',
  bindings: {
    error: '='
  },
  template: require('./errorPanel.html'),
  controller: forwardRef(() => ErrorPanelController)
};

export class ErrorPanelController {
}
