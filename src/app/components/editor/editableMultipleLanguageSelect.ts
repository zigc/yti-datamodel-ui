import { IQService } from 'angular';
import { availableLanguages, Language } from 'app/types/language';
import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    ngModel: '=',
    id: '@',
    title: '@',
    required: '='
  },
  template: `
      <editable-multiple id="{{$ctrl.id}}" data-title="{{$ctrl.title}}" ng-model="$ctrl.ngModel" required="$ctrl.required" input="$ctrl.input">
        <input-container>
          <autocomplete datasource="$ctrl.datasource">
            <input id="{{$ctrl.id}}"
                   type="text"
                   restrict-duplicates="$ctrl.ngModel"
                   language-input
                   ignore-form
                   autocomplete="off"
                   ng-model="$ctrl.input" />
          </autocomplete>
        </input-container>
      </editable-multiple>
  `
})
export class EditableMultipleLanguageSelectComponent {

  ngModel: Language[];
  input: Language;
  id: string;
  title: string;

  constructor(private $q: IQService) {
    'ngInject';
  }

  datasource = (_search: string) => this.$q.when(availableLanguages);
}
