import { ElementFinder } from 'protractor';

export class EditableComponent {

  inputElement: ElementFinder;
  content: ElementFinder;

  constructor(public editableElement: ElementFinder) {
    this.inputElement = editableElement.$('.editable-wrap [ng-model]');
    this.content = editableElement.$('.content');
  }

  static byTitleLocalizationKey(context: ElementFinder, title: string) {
    return new EditableComponent(context.$(`editable[data-title="${title}"]`));
  }

  isEditing() {
    return this.inputElement.isDisplayed();
  }

  appendValue(value: string) {
    this.inputElement.sendKeys(value);
  }

  setValue(value: string) {
    browser.wait(this.inputElement.isDisplayed, 1000);
    this.inputElement.clear().then(() => {
      this.appendValue(value);
    });
  }
}
