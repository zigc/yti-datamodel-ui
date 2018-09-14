import { Localizer } from 'app/services/languageService';
import { Concept } from 'app/entities/vocabulary';
import { Model } from 'app/entities/model';
import { LegacyComponent } from 'app/utils/angular';

@LegacyComponent({
  bindings: {
    concept: '=',
    model: '='
  },
  template: require('./conceptForm.html')
})
export class ConceptFormComponent {

  concept: Concept;
  model: Model;
  localizer: Localizer;
}
