import { module as mod } from './module';

mod.directive('nonEditableVocabulary', () => {
  return {
    restrict: 'E',
    scope: {
      vocabulary: '=',
      context: '='
    },
    template: `
      <div class="editable-wrap form-group">
        <editable-label data-title="'Vocabulary'"></editable-label>
        <p class="form-control-static">{{vocabulary.title | translateValue: ctrl.context}}</p>
      </div>
    `
  };
});
