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
        <span ng-if="!$ctrl.link">{{$ctrl.vocabulary.title | translateValue: $ctrl.context}}</span>
        <a ng-if="$ctrl.link" ng-href="{{$ctrl.link}}">
          {{$ctrl.vocabulary.title | translateValue: $ctrl.context}}
          <i ng-if="$ctrl.link" class="fas fa-external-link-alt x-small-item"></i>
        </a>
      </div>
    `
})
export class NonEditableVocabularyComponent {
}
