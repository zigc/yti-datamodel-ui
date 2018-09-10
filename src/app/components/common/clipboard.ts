import { ITimeoutService } from 'angular';
import { EditableForm } from 'app/components/form/editableEntityController';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

const clipboardImage = require('../../../assets/clippy.svg');

export const ClipboardComponent: ComponentDeclaration = {
  selector: 'clipboard',
  bindings: {
    text: '='
  },
  require: {
    form: '?^form'
  },
  template: `
    <img ng-src="{{$ctrl.clipboardImage}}" class="svg-icon"
         ng-if="$ctrl.text && !ctrl.isEditing()" 
         uib-tooltip="{{$ctrl.copyInfo}}"
         uib-popover="{{'Copied' | translate}}"
         popover-is-open="$ctrl.showCopiedMessage"
         popover-trigger="none"
         ngclipboard 
         ngclipboard-success="$ctrl.onCopy()"
         data-clipboard-text="{{$ctrl.text}}" />
    `,
  controller: forwardRef(() => ClipboardController)
};

class ClipboardController {

  text: string;
  showCopiedMessage = false;
  clipboardImage = clipboardImage;

  form: EditableForm;

  /* @ngInject */
  constructor(private gettextCatalog: GettextCatalog,
              private $timeout: ITimeoutService) {
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  get copyInfo() {
    return this.gettextCatalog.getString('Copy "{{text}}" to clipboard', { text: this.text });
  }

  onCopy() {
    this.showCopiedMessage = true;
    this.$timeout(() => this.showCopiedMessage = false, 2000);
  }
}
