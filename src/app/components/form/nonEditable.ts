import { IParseService, IScope } from 'angular';
import { DisplayItem, DisplayItemFactory, Value } from './displayItemFactory';
import { EditableForm } from './editableEntityController';
import { LanguageContext } from 'app/types/language';
import { LegacyComponent } from 'app/utils/angular';
import { isExternalLink } from 'app/components/form/href';

@LegacyComponent({
  bindings: {
    title: '@',
    value: '=',
    link: '=',
    onClick: '@',
    valueAsLocalizationKey: '@',
    context: '=',
    clipboard: '='
  },
  require: {
    form: '?^form'
  },
  template: require('./nonEditable.html')
})
export class NonEditableComponent {

  title: string;
  value: Value;
  link: string;
  valueAsLocalizationKey: boolean;
  context: LanguageContext;
  onClick: string;
  clipboard: string;

  item: DisplayItem;

  form: EditableForm;

  constructor(private $scope: IScope,
              private $parse: IParseService,
              private displayItemFactory: DisplayItemFactory) {
    'ngInject';
  }

  $onInit() {

    // we need to know if handler was set or not so parse ourselves instead of using scope '&'
    const clickHandler = this.$parse(this.onClick);
    const onClick = this.onClick ? (value: Value) => clickHandler(this.$scope.$parent, {value}) : undefined;

    this.item = this.displayItemFactory.create({
      context: () => this.context,
      value: () => this.value,
      link: () => this.link,
      valueAsLocalizationKey: this.valueAsLocalizationKey,
      hideLinks: () => this.isEditing(),
      onClick: onClick
    });
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  get style(): {} {
    if (this.isEditing()) {
      return { 'margin-bottom': '33px'};
    } else {
      return {};
    }
  }

  isExternalLink(link: string): boolean {
    return isExternalLink(link);
  }
}
