import { Modal } from '../common/modal.po';
import { Type } from '../../../src/services/entities';
import { EditableComponent } from '../common/component/editableComponent.po';
import { upperCaseFirst } from 'change-case';
import { ModelPage } from '../model/modelPage.po';
import { EditableMultipleComponent } from '../common/component/editableMultipleComponent.po';
import { SubmitButton } from '../common/component/submitButton.po';

export class AddModelModal extends Modal {

  prefix = EditableComponent.byTitleLocalizationKey(this.element, 'Prefix');
  label: EditableComponent;
  language = EditableMultipleComponent.byElementNameAndTitleLocalizationKey(this.element, 'editable-multiple-language-select', 'Model languages');
  submitButton = new SubmitButton(element(by.buttonText('Luo uusi')));

  constructor(private type: Type) {
    super();
    this.label = EditableComponent.byTitleLocalizationKey(this.element, upperCaseFirst(type) + ' label');
  }

  submit() {
    this.submitButton.submit();
    return new ModelPage(this.type);
  }
}
