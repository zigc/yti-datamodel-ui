import { ICompiledExpression, IPromise, IQService, IScope } from 'angular';
import { SearchPredicateModal } from './searchPredicateModal';
import { SearchClassModal } from './searchClassModal';
import { EditableForm } from 'app/components/form/editableEntityController';
import { Uri } from 'app/entities/uri';
import { DataSource } from 'app/components/form/dataSource';
import { ClassService } from 'app/services/classService';
import { PredicateService } from 'app/services/predicateService';
import { idExclusion, itemExclusion } from 'app/utils/exclusion';
import { ClassListItem } from 'app/entities/class';
import { PredicateListItem } from 'app/entities/predicate';
import { ClassType, KnownPredicateType } from 'app/types/entity';
import { Model } from 'app/entities/model';
import { LegacyComponent, modalCancelHandler } from 'app/utils/angular';


type DataType = ClassListItem|PredicateListItem;

@LegacyComponent({
  bindings: {
    uri: '=',
    type: '@',
    model: '=',
    id: '@',
    afterSelected: '&',
    mandatory: '=',
    excludeId: '=?',
    excludeItem: '=?',
    defaultToCurrentModel: '='
  },
  require: {
    form: '?^form'
  },
  template: `
      <autocomplete datasource="$ctrl.datasource" value-extractor="$ctrl.valueExtractor" exclude-provider="$ctrl.createItemExclusion">
        <input id="{{$ctrl.id}}"
               type="text"
               class="form-control"
               uri-input
               exclude-validator="$ctrl.createIdExclusion"
               ng-required="$ctrl.mandatory"
               model="$ctrl.model"
               ng-model="$ctrl.uri"
               ng-blur="$ctrl.handleChange()"
               autocomplete="off" />
      </autocomplete>

      <button id="{{$ctrl.id + '_choose_' + $ctrl.type + '_uri_select_button'}}"
              ng-if="$ctrl.isEditing()"
              type="button"
              class="btn btn-action btn-sm"
              ng-click="$ctrl.selectUri()">
        {{('Choose ' + $ctrl.type) | translate}}
      </button>
  `
})
export class UriSelectComponent {

  uri: Uri;
  type: ClassType|KnownPredicateType;
  model: Model;
  id: string;
  afterSelected: ICompiledExpression;
  mandatory: boolean;
  duplicate: (uri: Uri) => boolean;
  defaultToCurrentModel: boolean;
  datasource: DataSource<DataType>;
  private change: Uri|null = null;

  excludeId: (id: Uri) => string;
  excludeItem: (item: DataType) => string;
  valueExtractor = (item: DataType) => item.id;

  createIdExclusion = () => idExclusion(this.excludeId, this.excludeItem, this.datasource, this.$q);
  createItemExclusion = () => itemExclusion(this.excludeId, this.excludeItem);

  form: EditableForm;

  constructor(private $scope: IScope,
              private $q: IQService,
              private searchPredicateModal: SearchPredicateModal,
              private searchClassModal: SearchClassModal,
              private classService: ClassService,
              private predicateService: PredicateService) {
    'ngInject';
  }

  $onInit() {

    const modelProvider = () => this.model;
    this.datasource = this.type === 'class' || this.type === 'shape' ? this.classService.getClassesForModelDataSource(modelProvider)
                                                                     : this.predicateService.getPredicatesForModelDataSource(modelProvider);

    this.$scope.$watch(() => this.uri, (current, previous) => {
      if (!current || !current.equals(previous)) {
        this.change = current;
      }
    });
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  handleChange() {
    if (this.change) {
      this.afterSelected({id: this.change});
      this.change = null;
    }
  }

  selectUri() {
    const promise: IPromise<DataType> = this.type === 'class' || this.type === 'shape'
      ? this.searchClassModal.openWithOnlySelection(this.model, this.defaultToCurrentModel || false, this.createItemExclusion())
      : this.searchPredicateModal.openWithOnlySelection(this.model, this.type, this.createItemExclusion());

    promise.then(result => {
      this.uri = result.id;
      this.afterSelected({id: result.id});
    }, modalCancelHandler);
  }
}
