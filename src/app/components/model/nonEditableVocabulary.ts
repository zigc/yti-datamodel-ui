import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    vocabulary: '=',
    context: '=',
    link: '='
  },
  template: `
      <div class="editable-wrap form-group">
        <editable-label data-title="'Vocabulary'"></editable-label>
        <span ng-if="!link">{{$ctrl.vocabulary.title | translateValue: $ctrl.context}}</span>
        <pre>{{link}}</pre>
        <a ng-if="link" ng-href="{{link}}">{{$ctrl.vocabulary.title | translateValue: $ctrl.context}}</a>       
      </div>
    `
})
export class NonEditableVocabularyComponent {
}
