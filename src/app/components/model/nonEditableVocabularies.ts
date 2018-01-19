import { module as mod } from './module';

mod.directive('nonEditableVocabulary', () => {
  return {
    restrict: 'E',
    scope: {
      vocabulary: '=',
      context: '=',
      link: '='
    },
    template: `
      <div class="editable-wrap form-group">
        <editable-label data-title="'Vocabulary'"></editable-label>
        <span ng-if="!link">{{vocabulary.title | translateValue: ctrl.context}}</span>
        <pre>{{link}}</pre>
        <a ng-if="link" ng-href="{{link}}">{{vocabulary.title | translateValue: ctrl.context}}</a>       
      </div>
    `
  };
});
