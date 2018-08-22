import { IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import gettextCatalog = angular.gettext.gettextCatalog;
import { LanguageService } from 'app/services/languageService';
import { Property, Class } from 'app/entities/class';
import { anyMatching, flatten, groupBy } from 'yti-common-ui/utils/array';
import { stringMapToObject } from 'yti-common-ui/utils/object';
import { Model } from 'app/entities/model';

const noExclude = (_property: Property) => false;

export class AddPropertiesFromClassModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(klass: Class, classType: string, model: Model, exclude: (property: Property) => boolean = noExclude): IPromise<Property[]> {
    return this.$uibModal.open({
      template: require('./addPropertiesFromClassModal.html'),
      size: 'adapting',
      controllerAs: 'ctrl',
      controller: AddPropertiesFromClassModalController,
      resolve: {
        klass: () => klass,
        classType: () => classType,
        model: () => model,
        exclude: () => exclude
      }
    }).result;
  }
}

export class AddPropertiesFromClassModalController {

  properties: { [type: string]: Property[] };
  selectedProperties: Property[];

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance,
              public languageService: LanguageService,
              private gettextCatalog: gettextCatalog,
              klass: Class,
              public classType: string,
              public model: Model,
              private exclude: (property: Property) => boolean) {

    const propertiesWithKnownType = klass.properties.filter(p => p.normalizedPredicateType);
    this.properties = stringMapToObject(groupBy(propertiesWithKnownType, property => property.normalizedPredicateType!));
    this.selectAllWithKnownPredicates();
  }

  isExcluded(property: Property) {
    return this.exclude(property);
  }

  selectAllWithKnownPredicates() {
    const isRequiredNamespace = (ns: string) => anyMatching(this.model.importedNamespaces, importedNamespace => importedNamespace.namespace === ns);
    this.selectPropertiesWithPredicate(property => isRequiredNamespace(property.predicateId.namespace));
  }

  selectAll() {
    this.selectPropertiesWithPredicate(() => true);
  }

  private selectPropertiesWithPredicate(predicate: (property: Property) => boolean) {
    this.selectedProperties = flatten(Object.values(this.properties)).filter(property => !this.exclude(property) && predicate((property)));
  }

  deselectAll() {
    this.selectedProperties = [];
  }

  tooltip(property: Property) {
    if (this.isExcluded(property)) {
      return this.gettextCatalog.getString('Already added');
    } else {
      return this.languageService.translate(property.comment);
    }
  }

  confirm() {
    this.$uibModalInstance.close(this.selectedProperties.map(property => property.copy()));
  }
}
