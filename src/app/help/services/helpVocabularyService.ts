import { VocabularyService } from 'app/services/vocabularyService';
import { ResetableService } from './resetableService';
import { IPromise, IQService } from 'angular';
import { Language } from 'app/types/language';
import { Concept, Vocabulary } from 'app/entities/vocabulary';
import { Uri } from 'app/entities/uri';
import { ResourceStore } from './resourceStore';
import { analyze } from 'app/components/filter/textAnalyzer';
import { Localizable } from 'yti-common-ui/types/localization';
import { isDefined, requireDefined } from 'yti-common-ui/utils/object';
import { EntityCreatorService } from './entityCreatorService';

export const helpVocabularyName: Localizable = {
  fi: 'Julkisen hallinnon yhteinen sanasto',
  en: 'Finnish Public Sector Terminological Glossary (Controlled Vocabulary)'
};

export const helpVocabularyId = 'http://uri.suomi.fi/terminology/jhs/terminological-vocabulary-1';

export function helpConceptIdForIndex(index: number) {
  return 'http://uri.suomi.fi/terminology/jhs/concept-' + (index + 1);
}

// TODO Move vocabulary initialization as EntityLoader responsibility
export class InteractiveHelpVocabularyService implements VocabularyService, ResetableService {

  private vocabularyIndex = 0;
  private conceptIndex = 0;

  vocabularyStore = new ResourceStore<Vocabulary>();
  conceptStore = new ResourceStore<Concept>();

  constructor(private $q: IQService,
              private entityCreatorService: EntityCreatorService) {
    'ngInject';
  }

  reset(): IPromise<any> {

    this.vocabularyIndex = 0;
    this.vocabularyStore.clear();
    this.conceptIndex = 0;
    this.conceptStore.clear();

    return this.entityCreatorService.createVocabulary({
      prefix: 'jhs',
      index: ++this.vocabularyIndex,
      label: helpVocabularyName,
      description: {
        en: 'The Finnish Public Sector Terminological Glossary is a controlled vocabulary consisting of terms representing concepts that are defined in accordance with the Finnish Public Sector Recommendation JHS175. The concepts form a shared and harmonized core vocabulary for all public sector organizations.'
      }
    }).then(vocab => this.vocabularyStore.add(vocab));
  }

  getAllVocabularies(): IPromise<Vocabulary[]> {
    return this.$q.resolve(this.vocabularyStore.values());
  }

  searchConcepts(searchText: string, vocabulary?: Vocabulary): IPromise<Concept[]> {
    return this.$q.resolve(this.conceptStore.findAll(c => {
      const analysis = analyze(searchText, c, [x => x.label, x => x.definition]);
      return isDefined(analysis.matchScore) && (!vocabulary || vocabulary.id.equals(c.vocabulary.id));
    }));
  }

  createConceptSuggestion(vocabulary: Vocabulary, label: string, comment: string, lang: Language): IPromise<Uri> {

    return this.entityCreatorService.createConcept({
      vocabulary,
      index: ++this.conceptIndex,
      label: { [lang]: label },
      definition: { [lang]: comment }
    }).then(concept => {
      this.conceptStore.add(concept);
      return concept.id;
    });
  }

  getConcept(id: Uri): IPromise<Concept> {
    return this.$q.when(requireDefined(this.conceptStore.findFirst(cs => cs.id.equals(id))));
  }

  createConcept(label: Localizable, definition: Localizable): IPromise<Concept> {

    return this.getAllVocabularies()
      .then(vocabs => vocabs[0])
      .then(vocabulary => {
        return this.entityCreatorService.createConcept({
          vocabulary,
          index: ++this.conceptIndex,
          label,
          definition
        }).then(concept => {
          this.conceptStore.add(concept);
          return concept;
        });
      });
  }
}
