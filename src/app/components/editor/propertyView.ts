import { IQService, IScope } from 'angular';
import { ClassFormComponent } from './classForm';
import { Uri } from '../../entities/uri';
import { LanguageService } from '../../services/languageService';
import { allMatching, anyMatching } from 'yti-common-ui/utils/array';
import { hasLocalization } from '../../utils/language';
import { Class, Property } from '../../entities/class';
import { Model } from '../../entities/model';
import { Attribute, Predicate, PredicateListItem } from '../../entities/predicate';
import { LegacyComponent } from '../../utils/angular';
import { DataSource } from '../form/dataSource';

@LegacyComponent({
  bindings: {
    id: '@',
    property: '=',
    class: '=',
    model: '='
  },
  require: {
    classForm: '^classForm'
  },
  template: require('./propertyView.html')
})
export class PropertyViewComponent {

  property: Property;
  class: Class;
  model: Model;

  classForm: ClassFormComponent;

  comparablePropertiesDataSource: DataSource<PredicateListItem>;

  constructor(private $scope: IScope,
              private $element: JQuery,
              private languageService: LanguageService,
              private $q: IQService) {
    'ngInject';

    this.comparablePropertiesDataSource = (search) => {
      return this.$q.resolve(this.comparableProperties.map(prop => prop.predicate).filter(predicate => predicate instanceof Attribute) as Attribute[]);
    }
  }

  get otherPropertyLabels() {
    return this.otherProperties.map(property => property.label);
  }

  get otherAttributeLabels() {
    return this.property.normalizedPredicateType === 'attribute' ? this.otherProperties.filter(property => property.normalizedPredicateType === 'attribute').map(property => property.label) : [];
  }

  get otherPropertyIdentifiers() {
    return this.otherProperties.map(property => property.externalId);
  }

  get otherPropertyResourceIdentifiers() {
    return this.otherProperties.map(property => property.resourceIdentifier);
  }

  get showAdditionalInformation() {
    return hasLocalization(this.property.editorialNote);
  }

  get propertyPairCapable(): boolean {
    return this.property.normalizedPredicateType === 'attribute' && this.comparableProperties.length > 0;
  }

  get comparableProperties(): Property[] {
    const self = this.property;
    if (self.normalizedPredicateType === 'attribute') {
      return this.class.properties.filter(p => {
        // TODO: Check conditions. E.g., it might make sense to drop datatype equivalence requirement to allow saying "this 32 bit integer must be less than this 64 bit integer"
        return !self.internalId.equals(p.internalId)
          && p.normalizedPredicateType === 'attribute'
          && self.dataType === p.dataType;
      });
    }
    return [];
  }

  get predicateName() {
    const predicate = this.property.predicate;
    if (predicate instanceof Predicate) {
      return this.languageService.translate(predicate.label, this.model);
    } else if (predicate instanceof Uri) {
      return predicate.compact;
    } else {
      throw new Error('Unsupported predicate: ' + predicate);
    }
  }

  get predicateNameCompact() {
    const predicate = this.property.predicate;
    if (predicate instanceof Uri) {
      return predicate.compact;
    } else {
      throw new Error('Unsupported predicate: ' + predicate);
    }
  }

  get propertyInformationLabel() {

    switch (this.property.normalizedPredicateType) {
      case 'attribute':
        return 'Attribute information';
      case 'association':
        return 'Association information';
      default:
        return 'Property information';
    }
  }

  private get otherProperties() {
    return this.class.properties.filter(property => property.internalId.notEquals(this.property.internalId));
  }

  $onInit() {

    if (this.isOpen()) {
      this.scrollTo();
    }

    this.$scope.$watchCollection(() => this.class && this.class.properties, (oldProperties) => {

      const isPropertyAdded = allMatching(oldProperties, p => this.property.internalId.notEquals(p.internalId));

      if (this.isOpen() && isPropertyAdded) {
        this.scrollTo();
      }
    });
  }

  scrollTo(previousTop?: number) {

    const scrollTop = this.$element.offset().top;

    if (!previousTop || scrollTop !== previousTop) {
      // wait for stabilization
      setTimeout(() => this.scrollTo(scrollTop), 100);
    } else {
      jQuery('html, body').animate({ scrollTop: scrollTop - 105 }, 500);
    }
  }

  isOpen() {
    return this.classForm && this.classForm.openPropertyId === this.property.internalId.uuid;
  }

  isEditing() {
    return this.classForm && this.classForm.isEditing();
  }

  valueClassExclude = (valueClass: Uri) =>
    anyMatching(this.class.properties, p => p !== this.property && this.property.predicateId.equals(p.predicateId) && valueClass.equals(p.valueClass))
      ? 'Duplicate association target' : null;

  stemDatasource(_search: string) {
    return [
      new Uri('http://', {}),
      new Uri('https://', {}),
      new Uri('data:', {}),
      new Uri('mailto:', {}),
      new Uri('tel:', {}),
      new Uri('urn:', {})
    ];
  }

  removeProperty(property: Property) {
    this.class.removeProperty(property);
  }

  linkToValueClass() {
    return this.model.linkToResource(this.property.valueClass);
  }
}
