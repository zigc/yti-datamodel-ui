import { VocabularyService } from 'app/services/vocabularyService';
import { ResetableService } from './resetableService';
import { IPromise, IQService } from 'angular';
import { Language } from 'app/types/language';
import { Vocabulary, Concept } from 'app/entities/vocabulary';
import { Uri } from 'app/entities/uri';
import * as frames from 'app/entities/frames';
import { ResourceStore } from './resourceStore';
import { analyze } from 'app/components/filter/textAnalyzer';
import { GraphData } from '../../types/entity';
import { Url } from '../../entities/uri';
import { FrameService } from '../../services/frameService';
import { Localizable } from 'yti-common-ui/types/localization';
import { v4 as uuid } from 'node-uuid';

const context = {
  prefLabel : { '@id' : 'http://www.w3.org/2004/02/skos/core#prefLabel' },
  definition : { '@id' : 'http://www.w3.org/2004/02/skos/core#definition' },
  description : { '@id' : 'http://purl.org/dc/terms/description' },
  inScheme : { '@id' : 'http://www.w3.org/2004/02/skos/core#inScheme', '@type' : '@id' },
  id : { '@id' : 'http://termed.thl.fi/meta/id' },
  graph : { '@id' : 'http://termed.thl.fi/meta/graph' },
  type : { '@id' : 'http://termed.thl.fi/meta/type' },
  uri : { '@id' : 'http://termed.thl.fi/meta/uri' },
};

function toJsonLDLocalizations(localizable: Localizable) {
  return Object.entries(localizable).map(([lang, value]) => {
    return {
      '@language': lang,
      '@value': value
    }
  });
}

function createVocabularyJsonLD(prefix: string, index: number, label: Localizable, description: Localizable) {

  const id = `http://uri.suomi.fi/terminology/${prefix}/terminological-vocabulary-${index}`;

  return {
    '@graph': {
      '@id': id,
      '@type': 'skos:ConceptScheme',
      graph: uuid(),
      id: uuid(),
      type: 'TerminologicalVocabulary',
      uri: id,
      prefLabel: toJsonLDLocalizations(label),
      description: toJsonLDLocalizations(description)
    },
    '@context': context
  };
}

function createConceptJsonLD(vocabulary: Vocabulary, index: number, label: Localizable, definition: Localizable) {

  const vocabularyId = vocabulary.id.uri;
  const vocabularyNamespace = vocabularyId.substr(0, vocabularyId.indexOf('terminological-vocabulary-'));
  const id = vocabularyNamespace + 'concept' + index;

  return {
    '@graph': [
      {
        '@id' : id,
        '@type' : 'skos:Concept',
        inScheme : vocabulary.id.uri,
        id : uuid(),
        graph : vocabulary.vocabularyGraph,
        definition : toJsonLDLocalizations(definition),
        prefLabel : toJsonLDLocalizations(label)
      },
      vocabulary.graph
    ],
    '@context': context
  };
}

export class InteractiveHelpVocabularyService implements VocabularyService, ResetableService {

  private vocabularyIndex = 0;
  private conceptIndex = 0;

  vocabularyStore = new ResourceStore<Vocabulary>();
  conceptStore = new ResourceStore<Concept>();

  /* @ngInject */
  constructor(private $q: IQService,
              private frameService: FrameService) {
  }

  reset(): IPromise<any> {

    this.vocabularyIndex = 0;
    this.vocabularyStore.clear();
    this.conceptIndex = 0;
    this.conceptStore.clear();

    // TODO this logic/data should be in callers of HelpBuilder
    return this.addVocabulary('jhs', { fi: 'Julkisen hallinnon yhteinen sanasto' }, {})
      .then(jhs => {

        return this.$q.all([
          this.addConcept(jhs, { fi: 'omistaja' }, { fi: 'omistajan määritelmä' })
        ]);
      });
  }

  getAllVocabularies(): IPromise<Vocabulary[]> {
    return this.$q.resolve(this.vocabularyStore.findAll(() => true));
  }

  searchConcepts(searchText: string, vocabulary?: Vocabulary): IPromise<Concept[]> {
    return this.$q.resolve(this.conceptStore.findAll(c => {
      const analysis = analyze(searchText, c, [x => x.label, x => x.definition]);
      return !!analysis.matchScore && (!vocabulary || vocabulary.id.equals(c.vocabulary.id));
    }));
  }

  createConceptSuggestion(vocabulary: Vocabulary, label: string, comment: string, lang: Language): IPromise<Uri> {
    return this.addConcept(vocabulary, { [lang]: label }, { [lang]: comment }).then(c => c.id);
  }

  getConcept(id: Uri): IPromise<Concept> {
    return this.$q.when(this.conceptStore.findFirst(cs => cs.id.equals(id)));
  }

  private addConcept(vocabulary: Vocabulary, label: Localizable, definition: Localizable): IPromise<Concept> {

    const data = createConceptJsonLD(vocabulary, ++this.conceptIndex, label, definition);

    return this.deserializeConcept(data, data['@graph'][0]['@id']).then(c => {
      this.conceptStore.add(c);
      return c;
    });
  }

  private addVocabulary(prefix: string, label: Localizable, description: Localizable): IPromise<Vocabulary> {
    return this.deserializeVocabulary(createVocabularyJsonLD(prefix, ++this.vocabularyIndex, label, description)).then(v => {
      this.vocabularyStore.add(v);
      return v;
    });
  }

  private deserializeConcept(data: GraphData, id: Url): IPromise<Concept> {
    return this.frameService.frameAndMap(data, false, frames.conceptFrame(data, id), () => Concept);
  }

  private deserializeVocabulary(data: GraphData): IPromise<Vocabulary> {
    return this.frameService.frameAndMap(data, false, frames.vocabularyFrame(data), () => Vocabulary);
  }
}
