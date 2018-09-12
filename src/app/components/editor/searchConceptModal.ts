import { IScope, IPromise, IQService } from 'angular';
import { IModalService, IModalServiceInstance } from 'angular-ui-bootstrap';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
import { LanguageService, Localizer } from 'app/services/languageService';
import { comparingLocalizable } from 'app/utils/comparator';
import { EditableForm } from 'app/components/form/editableEntityController';
import { AddNew } from 'app/components/common/searchResults';
import { anyMatching, limit } from 'yti-common-ui/utils/array';
import { lowerCase, upperCaseFirst } from 'change-case';
import { SearchController, SearchFilter } from 'app/types/filter';
import { ifChanged } from 'app/utils/angular';
import { Concept, Vocabulary } from 'app/entities/vocabulary';
import { Model } from 'app/entities/model';
import { ClassType, KnownPredicateType } from 'app/types/entity';
import { VocabularyService } from 'app/services/vocabularyService';
import { filterAndSortSearchResults, defaultLabelComparator } from 'app/components/filter/util';
import { Uri } from 'app/entities/uri';

const limitQueryResults = 1000;

export interface NewEntityData {
  label: string;
}

export class EntityCreation {
  constructor(public conceptId: Uri|null, public entity: NewEntityData) {
  }
}

class NewConceptData implements NewEntityData {
  definition: string;

  constructor(public label: string, public vocabulary: Vocabulary) {
  }
}

class AddWithoutConceptData implements NewEntityData {
  constructor(public label: string) {
  }
}

export class SearchConceptModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  private open(vocabularies: Vocabulary[],
               model: Model,
               type: ClassType|KnownPredicateType|null,
               allowSuggestions: boolean,
               newEntityCreation: boolean,
               initialSearch: string): IPromise<Concept|EntityCreation> {

    return this.$uibModal.open({
      template: require('./searchConceptModal.html'),
      size: 'lg',
      controller: SearchConceptController,
      controllerAs: '$ctrl',
      backdrop: true,
      resolve: {
        vocabularies: () => vocabularies,
        model: () => model,
        type: () => type,
        newEntityCreation: () => newEntityCreation,
        initialSearch: () => initialSearch,
        allowSuggestions: () => allowSuggestions
      }
    }).result;
  }

  openSelection(vocabularies: Vocabulary[], model: Model, allowSuggestions: boolean, type?: ClassType|KnownPredicateType): IPromise<Concept> {
    return this.open(vocabularies, model, type || null, allowSuggestions, false, '') as IPromise<Concept>;
  }

  openNewEntityCreation(vocabularies: Vocabulary[], model: Model, type: ClassType|KnownPredicateType, initialSearch: string): IPromise<EntityCreation> {
    return this.open(vocabularies, model, type, true, true, initialSearch) as IPromise<EntityCreation>;
  }
}

export interface SearchPredicateScope extends IScope {
  form: EditableForm;
}

function isConcept(obj: Concept|NewConceptData|AddWithoutConceptData|null): obj is Concept {
  return obj instanceof Concept;
}

function isNewConceptData(obj: Concept|NewConceptData|AddWithoutConceptData|null): obj is NewConceptData {
  return obj instanceof NewConceptData;
}

function isAddWithoutConceptData(obj: Concept|NewConceptData|AddWithoutConceptData|null): obj is AddWithoutConceptData {
  return obj instanceof AddWithoutConceptData;
}

class SearchConceptController implements SearchController<Concept> {

  queryResults: Concept[];
  searchResults: (Concept|AddNewConcept)[];
  selection: Concept|NewConceptData|AddWithoutConceptData|null = null;
  defineConceptTitle: string;
  buttonTitle: string;
  labelTitle: string;
  selectedVocabulary: Vocabulary;
  searchText = '';
  submitError: string|null = null;
  loadingResults: boolean;
  selectedItem: Concept|AddNewConcept|AddWithoutConcept;
  vocabularies: Vocabulary[];
  private localizer: Localizer;

  contentExtractors = [ (concept: Concept) => concept.label ];
  private searchFilters: SearchFilter<Concept>[] = [];

  editInProgress = () => this.$scope.form.editing && this.$scope.form.$dirty;

  constructor(private $scope: SearchPredicateScope,
              private $uibModalInstance: IModalServiceInstance,
              private $q: IQService,
              private languageService: LanguageService,
              public type: ClassType|KnownPredicateType|null,
              initialSearch: string,
              public newEntityCreation: boolean,
              private allowSuggestions: boolean,
              vocabularies: Vocabulary[],
              public model: Model,
              private vocabularyService: VocabularyService,
              private gettextCatalog: GettextCatalog) {
    'ngInject';
    this.localizer = languageService.createLocalizer(model);
    this.defineConceptTitle = type ? `Define concept for the ${newEntityCreation ? 'new ' : ''}${type}` : 'Search concept';
    this.buttonTitle = (newEntityCreation ? 'Create new ' + type : 'Use');
    this.labelTitle = type ? `${upperCaseFirst(type)} label` : '';
    this.searchText = initialSearch;
    this.vocabularies = vocabularies.slice();
    this.vocabularies.sort(this.vocabularyComparator);
    this.loadingResults = false;

    $scope.$watch(() => this.searchText, () => this.query(this.searchText).then(() => this.search()));
    $scope.$watch(() => this.selectedVocabulary, ifChanged(() => this.query(this.searchText).then(() => this.search())));
    $scope.$watch(() => this.localizer.language, ifChanged(() => this.query(this.searchText).then(() => this.search())));
  }

  addFilter(filter: SearchFilter<Concept>) {
    this.searchFilters.push(filter);
  }

  get items() {
    return this.queryResults;
  }

  get vocabularyComparator() {
    return comparingLocalizable<Vocabulary>(this.localizer, vocabulary => vocabulary.title);
  }

  isSelectionConcept() {
    return isConcept(this.selection);
  }

  isSelectionNewConceptData() {
    return isNewConceptData(this.selection);
  }

  isSelectionAddWithoutConceptData() {
    return isAddWithoutConceptData(this.selection);
  }

  query(searchText: string): IPromise<any> {
    this.loadingResults = true;

    if (searchText) {
      return this.vocabularyService.searchConcepts(searchText, this.selectedVocabulary ? this.selectedVocabulary : undefined)
        .then((results: Concept[]) => {

          const resultsWithReferencedVocabularies =
            results.filter(concept =>
              anyMatching(this.vocabularies, v => v.id.equals(concept.vocabulary.id)));

          this.queryResults = limit(resultsWithReferencedVocabularies, limitQueryResults);
          this.loadingResults = false;
        });
    } else {
      this.loadingResults = false;
      return this.$q.when(this.queryResults = []);
    }
  }

  search() {
    if (this.queryResults) {

      const suggestText = `${this.gettextCatalog.getString('suggest')} '${this.searchText}'`;
      const toVocabularyText = `${this.gettextCatalog.getString('to vocabulary')}`;
      const addNewText = suggestText + ' ' + toVocabularyText;
      const addWithoutConcept = this.gettextCatalog.getString('Create new ' + this.type + ' without referencing concept');

      this.searchResults = [
        new AddNewConcept(addNewText,  () => this.canAddNew()),
        new AddWithoutConcept(addWithoutConcept,  () => this.newEntityCreation),
        ...filterAndSortSearchResults<Concept>(this.queryResults, this.searchText, this.contentExtractors, this.searchFilters, defaultLabelComparator(this.localizer))
      ];
    } else {
      this.searchResults = [];
    }
  }

  selectItem(item: Concept|AddNewConcept|AddWithoutConcept) {

    this.selectedItem = item;
    this.submitError = null;
    this.$scope.form.editing = false;
    this.$scope.form.$setPristine();

    if (item instanceof AddNewConcept) {
      this.$scope.form.editing = true;
      this.selection = new NewConceptData(lowerCase(this.searchText, this.localizer.language), this.resolveInitialVocabulary());
    } else if (item instanceof AddWithoutConcept) {
      this.selection = new AddWithoutConceptData(this.searchText);
    } else {
      this.selection = null;
      this.vocabularyService.getConcept(item.id).then(concept => this.selection = concept);
    }
  }

  loadingSelection(item: Concept|AddNew) {
    if (item instanceof AddNew || item !== this.selectedItem) {
      return false;
    } else {
      if (!this.selection) {
        return true;
      } else {
        const searchResult = <Concept> item;
        const selection = this.selection;
        return isConcept(selection) && !searchResult.id.equals(selection.id);
      }
    }
  }

  resolveInitialVocabulary() {
    return this.vocabularies[0];
  }

  canAddNew() {
    return this.allowSuggestions && !!this.searchText && this.vocabularies.length > 0;
  }

  confirm() {
    this.$uibModalInstance.close(this.resolveResult());
  }

  close() {
    this.$uibModalInstance.dismiss('cancel');
  }

  private resolveResult(): IPromise<Concept|EntityCreation> {

    const selection = this.selection;
    const language = this.languageService.getModelLanguage(this.model);

    if (isNewConceptData(selection)) {

      const conceptSuggestionId =
        this.vocabularyService.createConceptSuggestion(
          selection.vocabulary,
          selection.label,
          selection.definition,
          language,
          this.model
        );

      if (this.newEntityCreation) {
        return conceptSuggestionId
          .then(csId => new EntityCreation(csId, { label: selection.label }));
      } else {
        return conceptSuggestionId
          .then(csId => this.vocabularyService.getConcept(csId));
      }
    } else if (isAddWithoutConceptData(selection)) {

      if (!this.newEntityCreation) {
        throw new Error('Must be new entity creation');
      }

      return this.$q.when(new EntityCreation(null, { label: selection.label }))

    } else if (isConcept(selection)) {
      if (this.newEntityCreation) {
        return this.$q.when(new EntityCreation(selection.id, { label: selection.label[language] }));
      } else {
        return this.$q.when(selection);
      }
    } else {
      throw new Error('Unsupported selection ' + selection);
    }
  }
}

class AddNewConcept extends AddNew {
  constructor(public label: string,
              public show: () => boolean) {
    super(label, show);
  }
}

class AddWithoutConcept extends AddNew {
  constructor(public label: string,
              public show: () => boolean) {
    super(label, show);
  }
}
