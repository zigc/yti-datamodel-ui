import { INgModelController, IParseService, IScope } from 'angular';
import { DisplayItem, DisplayItemFactory, Value } from './displayItemFactory';
import { EditableForm } from './editableEntityController';
import { LanguageContext } from 'app/types/language';
import { LegacyComponent } from 'app/utils/angular';
import { isExternalLink } from 'app/components/form/href';

const NG_HIDE_CLASS = 'ng-hide';
const NG_HIDE_IN_PROGRESS_CLASS = 'ng-hide-animate';

@LegacyComponent({
  bindings: {
    title: '@',
    link: '=',
    valueAsLocalizationKey: '@',
    disable: '=',
    context: '=',
    onClick: '@',
    clipboard: '=',
    autofocus: '@'
  },
  template: require('./editable.html'),
  transclude: true,
  require: {
    form: '?^form'
  }
})
export class EditableComponent {

  title: string;
  valueAsLocalizationKey: boolean;
  link: string;
  disable: boolean;
  context: LanguageContext;
  onClick: string;
  clipboard: string;
  autofocus: string;

  item: DisplayItem;

  form: EditableForm;
  input: JQuery;
  inputNgModelCtrl: INgModelController;

  constructor(private $scope: IScope,
              private $parse: IParseService,
              private $animate: any,
              private $element: JQuery,
              private displayItemFactory: DisplayItemFactory) {
    'ngInject';
  }

  get value() {
    return this.inputNgModelCtrl && this.inputNgModelCtrl.$modelValue;
  }

  get inputId() {
    return this.input && this.input.attr('id');
  }

  get required() {
    return !this.disable && this.input && (this.input.attr('required') || (this.inputNgModelCtrl && 'requiredLocalized' in this.inputNgModelCtrl.$validators));
  }

  $onInit() {

    // we need to know if handler was set or not so parse ourselves instead of using scope '&'
    const clickHandler = this.$parse(this.onClick);
    const onClick = this.onClick ? (value: Value) => clickHandler(this.$scope.$parent, { value }) : undefined;

    this.item = this.displayItemFactory.create({
      context: () => this.context,
      value: () => this.value,
      link: () => this.link,
      valueAsLocalizationKey: this.valueAsLocalizationKey,
      onClick: onClick
    });
  }

  $postLink() {

    this.input = this.$element.find('[ng-model]');
    this.inputNgModelCtrl = this.input.controller('ngModel');

    this.$scope.$watch(() => this.item.displayValue || this.isEditing(), show => {
      this.$animate[show ? 'removeClass' : 'addClass'](this.$element, NG_HIDE_CLASS, {
        tempClasses: NG_HIDE_IN_PROGRESS_CLASS
      });
    });

    // move error messages element next to input
    this.input.after(this.$element.find('error-messages').detach());

    this.$scope.$watch(() => this.isEditing(), (currentEditing) => {

      const shouldFocus = this.autofocus && this.$scope.$parent.$eval(this.autofocus);

      if (shouldFocus && currentEditing) {
        setTimeout(() => this.input.focus(), 0);
      }
    });

    // TODO: prevent hidden and non-editable fields participating validation with some more obvious mechanism
    this.$scope.$watchCollection(() => Object.keys(this.inputNgModelCtrl.$error), keys => {
      if (!this.isEditing()) {
        for (const key of keys) {
          this.inputNgModelCtrl.$setValidity(key, true);
        }
      }
    });
  }

  isEditing() {
    return this.form && (this.form.editing || this.form.pendingEdit) && !this.disable;
  }

  isExternalLink(link: string): boolean {
    return isExternalLink(link);
  }
}
