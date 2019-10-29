import * as _ from 'lodash';
import { SearchController, TextAnalysis } from '../../types/filter';
import { IScope } from 'angular';
import { isDefined } from 'yti-common-ui/utils/object';
import { collectIds } from '../../utils/entity';
import { comparingLocalizable } from '../../utils/comparator';
import { LanguageService } from '../../services/languageService';
import { ifChanged, LegacyComponent } from '../../utils/angular';
import { ClassListItem } from '../../entities/class';
import { PredicateListItem } from '../../entities/predicate';
import { Model } from '../../entities/model';
import { DefinedBy } from '../../entities/definedBy';
import { Uri } from '../../entities/uri';
import { DefinedByType } from '../../types/entity';

type ItemType = ClassListItem | PredicateListItem;
type ModelOptionType = 'definedByThis' | 'importedNamespaces';

interface ModelOption {
  id: Uri;
  optionType: ModelOptionType;
}

@LegacyComponent({
  bindings: {
    searchController: '=',
    type: '@',
    model: '=',
    defaultShow: '=',
    hideThisModel: '=',
    modelType: '='
  },
  template: `
      <select id="model"
              class="form-control"
              style="width: auto"
              ng-model="$ctrl.showModel"
              ng-options="$ctrl.isImportedNamespacesOption(model)
                        ? ('Imported namespaces' | translate)
                        : ($ctrl.isDefinedByThisOption(model) ? ('Defined by this model' | translate) : (model | translateLabel: $ctrl.model))
                        for model in $ctrl.modelOptions">
        <option value="" translate>All models</option>
      </select>
  `
})
export class ModelFilterComponent {

  searchController: SearchController<ItemType>;
  type: 'class' | 'predicate';
  model: Model;
  defaultShow: ModelOptionType;
  hideThisModel: boolean;

  showModel: Model | DefinedBy | ModelOption;
  modelOptions: (ModelOption | DefinedBy)[] = [];
  importedNamespacesOption: ModelOption;
  definedByThisOption: ModelOption;
  modelType: DefinedByType | null;
  private currentModelImportedNamespaceIds: Set<string> = new Set<string>();

  constructor(private $scope: IScope,
              private languageService: LanguageService) {
    'ngInject';
  }

  $onInit() {

    this.importedNamespacesOption = { id: this.model.id, optionType: 'importedNamespaces' };
    this.definedByThisOption = { id: this.model.id, optionType: 'definedByThis' };

    this.showModel = this.defaultShowOption;

    this.$scope.$watch(() => this.model, () => {
      this.currentModelImportedNamespaceIds = collectIds(this.model.importedNamespaces);
      this.searchController.search();
    });

    this.$scope.$watch(() => this.searchController.items, items => this.filterModelOptions(items, this.modelType));
    this.$scope.$watch(() => this.modelType, modelType => this.filterModelOptions(this.searchController.items, modelType));

    this.searchController.addFilter((item: TextAnalysis<ItemType>) => {
      if (!this.showModel) {
        return true;
      } else if (this.isImportedNamespacesOption(this.showModel)) {
        return this.currentModelImportedNamespaceIds.has(item.item.definedBy.id.toString());
      } else {
        return isDefined(item.item.definedBy) && item.item.definedBy.id.equals(this.showModel.id);
      }
    });

    this.$scope.$watch(() => this.showModel, ifChanged(() => {
      return this.searchController.search();
    }));
  }

  filterModelOptions(items: ItemType[], modelType: DefinedByType | null) {
    const localizer = this.languageService.createLocalizer(this.model);

    const definedByFromClasses = _.chain(items)
      .map(item => item.definedBy!)
      .uniqBy(definedBy => definedBy.id.toString())
      .value()
      .sort(comparingLocalizable<DefinedBy>(localizer, definedBy => definedBy.label));

    const definedByFilteredByType = definedByFromClasses.filter(model =>  modelType ? model.isOfType(modelType) : true);

    this.modelOptions = this.hideThisModel ? definedByFilteredByType
                                           : [this.importedNamespacesOption, this.definedByThisOption, ...definedByFilteredByType];
  }

  isDefinedByThisOption(item: DefinedBy|ModelOption) {
    return !(item instanceof DefinedBy) && item.optionType === 'definedByThis';
  }

  isImportedNamespacesOption(item: DefinedBy|ModelOption) {
    return !(item instanceof DefinedBy) && item.optionType === 'importedNamespaces';
  }

  get defaultShowOption() {
    return this.defaultShow === 'definedByThis' ? this.definedByThisOption
    :  this.defaultShow === 'importedNamespaces' ? this.importedNamespacesOption : this.defaultShow;
  }
}
