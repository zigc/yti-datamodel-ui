import { IScope, IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { ReferenceDataService } from 'app/services/referenceDataService';
import { comparingLocalizable } from 'app/utils/comparator';
import { Localizer, LanguageService } from 'app/services/languageService';
import { AddNew } from 'app/components/common/searchResults';
import GettextCatalog = angular.gettext.gettextCatalog;
import { EditableForm } from 'app/components/form/editableEntityController';
import { Uri } from 'app/entities/uri';
import { anyMatching, allMatching } from 'yti-common-ui/utils/array';
import * as _ from 'lodash';
import { Exclusion } from 'app/utils/exclusion';
import { SearchController, SearchFilter } from 'app/types/filter';
import { ifChanged } from 'app/utils/angular';
import { ReferenceData, ReferenceDataServer, ReferenceDataGroup } from 'app/entities/referenceData';
import { filterAndSortSearchResults, defaultTitleComparator } from 'app/components/filter/util';
import { LanguageContext } from 'app/types/language';
import { Model } from 'app/entities/model';
import { Status, regularStatuses } from 'yti-common-ui/entities/status';

interface WithReferenceDatas {
  referenceDatas: ReferenceData[];
}

const noExclude = (_referenceData: ReferenceData) => null;

export class SearchReferenceDataModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(model: WithReferenceDatas|null, context: LanguageContext, exclude: Exclusion<ReferenceData>): IPromise<ReferenceData> {

    return this.$uibModal.open({
      template: require('./searchReferenceDataModal.html'),
      size: 'lg',
      controller: SearchReferenceDataModalController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        context: () => context,
        exclude: () => exclude
      }
    }).result;
  }

  openSelectionForModel(context: LanguageContext, exclude: Exclusion<ReferenceData> = noExclude): IPromise<ReferenceData> {
    return this.open(null, context, exclude);
  }

  openSelectionForProperty(model: Model, exclude: Exclusion<ReferenceData> = noExclude) {
    return this.open(model, model, exclude);
  }
}

export interface SearchReferenceDataScope extends IScope {
  form: EditableForm;
}

export class SearchReferenceDataModalController implements SearchController<ReferenceData> {

  searchResults: (ReferenceData|AddNewReferenceData)[];
  referenceDataServers: ReferenceDataServer[];
  referenceDatas: ReferenceData[];
  referenceDataGroups: ReferenceDataGroup[];
  showServer: ReferenceDataServer;
  showGroup: ReferenceDataGroup|null;
  searchText = '';
  loadingResults = true;
  selectedItem: ReferenceData|AddNewReferenceData;
  selection: ReferenceData|AddNewReferenceDataFormData;
  cannotConfirm: string|null;
  submitError: string|null = null;
  showStatus: Status|null;

  localizer: Localizer;

  contentMatchers = [
    { name: 'Label', extractor: (referenceData: ReferenceData) => referenceData.title },
    { name: 'Description', extractor: (referenceData: ReferenceData) => referenceData.description }
  ];

  contentExtractors = this.contentMatchers.map(m => m.extractor);

  private searchFilters: SearchFilter<ReferenceData>[] = [];

  /* @ngInject */
  constructor(private $scope: SearchReferenceDataScope,
              private $uibModalInstance: IModalServiceInstance,
              public model: WithReferenceDatas|null,
              public context: LanguageContext,
              private referenceDataService: ReferenceDataService,
              languageService: LanguageService,
              private gettextCatalog: GettextCatalog,
              public exclude: Exclusion<ReferenceData>) {

    this.localizer = languageService.createLocalizer(context);

    const init = (referenceDatas: ReferenceData[]) => {
      this.referenceDatas = referenceDatas;

      this.referenceDataGroups = _.chain(this.referenceDatas)
        .map(referenceData => referenceData.groups)
        .flatten<ReferenceDataGroup>()
        .uniqBy(group => group.id.uri)
        .value()
        .sort(comparingLocalizable<ReferenceDataGroup>(this.localizer, group => group.title));

      if (this.showGroup && allMatching(this.referenceDataGroups, group => !group.id.equals(this.showGroup!.id))) {
        this.showGroup = null;
      }

      this.search();
      this.loadingResults = false;
    };


    if (model != null) {
      init(model.referenceDatas);
    } else {

      const serversPromise = referenceDataService.getReferenceDataServers().then(servers => this.referenceDataServers = servers);

      $scope.$watch(() => this.showServer, server => {
        this.loadingResults = true;
        serversPromise
          .then(servers => referenceDataService.getReferenceDatasForServers(server ? [server] : servers))
          .then(init);
      });
    }

    this.addFilter(referenceData =>
      !this.showGroup || anyMatching(referenceData.item.groups, group => group.id.equals(this.showGroup!.id))
    );

    this.addFilter(referenceData =>
      !this.showStatus || referenceData.item.status === this.showStatus
    );

    $scope.$watch(() => this.showGroup, ifChanged<ReferenceDataGroup|null>(() => this.search()));
    $scope.$watch(() => this.showStatus, ifChanged<Status|null>(() => this.search()));
  }

  addFilter(filter: SearchFilter<ReferenceData>) {
    this.searchFilters.push(filter);
  }

  get items() {
    return this.referenceDatas;
  }

  get showExcluded() {
    return !!this.searchText;
  }

  get statuses() {
    return regularStatuses;
  }

  search() {
    if (this.referenceDatas) {
      
      this.searchResults = [
        new AddNewReferenceData(`${this.gettextCatalog.getString('Create new reference data')} '${this.searchText}'`, this.canAddNew.bind(this)),
        ...filterAndSortSearchResults(this.referenceDatas, this.searchText, this.contentExtractors, this.searchFilters, defaultTitleComparator(this.localizer, this.exclude))
      ];
    }
  }

  selectItem(item: ReferenceData|AddNewReferenceData) {
    this.selectedItem = item;
    this.submitError = null;
    this.$scope.form.editing = false;
    this.$scope.form.$setPristine();

    if (item instanceof AddNewReferenceData) {
      this.$scope.form.editing = true;
      this.selection = new AddNewReferenceDataFormData();

    } else if (item instanceof ReferenceData) {

      this.cannotConfirm = this.exclude(item);

      if (!this.cannotConfirm) {
        this.selection = item;
      }
    } else {
      throw new Error('Unsupported item: ' + item);
    }
  }

  confirm() {
    const selection = this.selection;

    if (selection instanceof AddNewReferenceDataFormData) {
      this.referenceDataService.newReferenceData(selection.uri, selection.label, selection.description, this.localizer.language)
        .then(referenceData => this.$uibModalInstance.close(referenceData), err => this.submitError = err.data.errorMessage);
    } else {
      this.$uibModalInstance.close((<ReferenceData> selection));
    }
  }

  loadingSelection(item: ReferenceData|AddNewReferenceDataFormData) {
    const selection = this.selection;
    if (item instanceof ReferenceData) {
      return item === this.selectedItem && (!selection || (!this.isSelectionFormData() && !item.id.equals((<ReferenceData> selection).id)));
    } else {
      return false;
    }
  }

  isSelectionFormData(): boolean {
    return this.selection instanceof AddNewReferenceDataFormData;
  }

  canAddNew() {
    return !!this.searchText && !this.model;
  }

  close() {
    this.$uibModalInstance.dismiss('cancel');
  }
}

class AddNewReferenceDataFormData {
  uri: Uri;
  label: string;
  description: string;
}

class AddNewReferenceData extends AddNew {
  constructor(public label: string, public show: () => boolean) {
    super(label, show);
  }
}
