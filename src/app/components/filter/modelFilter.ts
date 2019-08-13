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

type ItemType = ClassListItem|PredicateListItem;

@LegacyComponent({
  bindings: {
    searchController: '=',
    type: '@',
    model: '=',
    defaultShow: '='
  },
  template: `
      <select id="model"
              class="form-control"
              style="width: auto"
              ng-model="$ctrl.showModel"
              ng-options="$ctrl.isThisModel(model)
                        ? ('Imported namespaces' | translate)
                        : (model | translateLabel: $ctrl.model)
                        for model in $ctrl.models">
        <option value="" translate>All models</option>
      </select>
  `
})
export class ModelFilterComponent {

  searchController: SearchController<ItemType>;
  type: 'class'|'predicate';
  model: Model;
  defaultShow: Model|DefinedBy;

  showModel: Model|DefinedBy;
  models: (Model|DefinedBy)[] = [];
  private currentModelImportedNamespaceIds: Set<string> = new Set<string>();

  constructor(private $scope: IScope,
              private languageService: LanguageService) {
    'ngInject';
  }

  $onInit() {

    const localizer = this.languageService.createLocalizer(this.model);

    this.showModel = this.defaultShow;

    this.$scope.$watch(() => this.model, () => {
      this.currentModelImportedNamespaceIds = collectIds(this.model.importedNamespaces);
      this.searchController.search();
    });

    this.$scope.$watch(() => this.searchController.items, items => {
      const definedByFromClasses = _.chain(items)
        .map(item => item.definedBy!)
        .uniqBy(definedBy => definedBy.id.toString())
        .value()
        .sort(comparingLocalizable<DefinedBy>(localizer, definedBy => definedBy.label));

      this.models = [this.model, ...definedByFromClasses];
    });

    this.searchController.addFilter((item: TextAnalysis<ItemType>) => {
        if (!this.showModel) {
          return true;
        } else if (this.showModel === this.model) {
          return this.currentModelImportedNamespaceIds.has(item.item.definedBy.id.toString());
        } else {
          return isDefined(item.item.definedBy) && item.item.definedBy.id.equals(this.showModel.id);
        }
      }
    );

    this.$scope.$watch(() => this.showModel, ifChanged(() => {
      return this.searchController.search();
    }));
  }

  isThisModel(item: DefinedBy|Model) {
    return this.model === item;
  }
}
