import { IScope } from 'angular';
import { Referrer, Usage } from 'app/entities/usage';
import { LanguageContext } from 'app/types/language';
import { groupBy } from 'yti-common-ui/utils/array';
import { stringMapToObject } from 'yti-common-ui/utils/object';
import { LegacyComponent } from 'app/utils/angular';
import { EditableForm } from 'app/components/form/editableEntityController';

@LegacyComponent({
  bindings: {
    usage: '=',
    exclude: '=',
    context: '=',
    showLinks: '@'
  },
  require: {
    form: '?^form'
  },
  template: require('./usage.html')
})
export class UsageComponent {

  usage: Usage;
  exclude: (referrer: Referrer) => boolean;
  context: LanguageContext;
  showLinks: string;
  referrers: { [type: string]: Referrer[] };

  form: EditableForm;

  constructor(private $scope: IScope) {
    'ngInject';
  }

  $onInit() {
    this.$scope.$watch(() => this.usage, usage => {
      if (usage) {
        const excludeFilter = (referrer: Referrer) => referrer.normalizedType && !this.exclude || !this.exclude(referrer);
        this.referrers = stringMapToObject(groupBy(usage.referrers.filter(excludeFilter), referrer => referrer.normalizedType!));
      } else {
        this.referrers = {};
      }
    });
  }

  isShowLinks() {
    return this.showLinks === 'true' && (!this.form || !this.form.editing);
  }
}
