import { IScope } from 'angular';
import { ClassViewController } from './classView';
import { AddPropertiesFromClassModal } from './addPropertiesFromClassModal';
import { Uri } from 'app/entities/uri';
import { ClassService } from 'app/services/classService';
import { isDefined, requireDefined } from 'yti-common-ui/utils/object';
import { SearchPredicateModal } from './searchPredicateModal';
import { EditableForm } from 'app/components/form/editableEntityController';
import { Option } from 'app/components/common/buttonWithOptions';
import { SearchClassModal, noExclude } from './searchClassModal';
import { SessionService } from 'app/services/sessionService';
import { LanguageService } from 'app/services/languageService';
import { Localizer } from 'app/types/language';
import { comparingLocalizable } from 'app/utils/comparator';
import { Class, Property, ClassListItem } from 'app/entities/class';
import { Model } from 'app/entities/model';
import { modalCancelHandler } from 'app/utils/angular';
import { labelNameToResourceIdIdentifier } from 'yti-common-ui/utils/resource';
import { Localizable } from 'yti-common-ui/types/localization';
import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const ClassFormComponent: ComponentDeclaration = {
  selector: 'classForm',
  template: require('./classForm.html'),
  require: {
    classView: '?^classView',
    form: '?^form'
  },
  bindings: {
    id: '=',
    class: '=',
    oldClass: '=',
    model: '=',
    openPropertyId: '='
  },
  controller: forwardRef(() => ClassFormController)
};

export class ClassFormController {

  class: Class;
  properties: Property[];
  oldClass: Class;
  model: Model;
  openPropertyId: string;
  shouldAutofocus: boolean;
  addPropertyActions: Option[];
  localizer: Localizer;

  onPropertyReorder = (property: Property, index: number) => property.index = index;
  superClassExclude = (klass: ClassListItem) => klass.isOfType('shape') ? 'Super cannot be shape' : null;

  classView: ClassViewController;
  form: EditableForm;

  constructor(private $scope: IScope,
              private classService: ClassService,
              private sessionService: SessionService,
              private languageService: LanguageService,
              private searchPredicateModal: SearchPredicateModal,
              private searchClassModal: SearchClassModal,
              private addPropertiesFromClassModal: AddPropertiesFromClassModal) {
    'ngInject';
  }

  $onInit() {

    const setProperties = () => {
      if (this.isEditing() || !this.sortAlphabetically) {
        this.properties = this.class.properties;
      } else {
        this.properties = this.class.properties.slice();
        this.properties.sort(comparingLocalizable<Property>(this.languageService.createLocalizer(this.model), property => property.label));
      }
    };

    this.$scope.$watchGroup([
        () => this.class,
        () => this.languageService.getModelLanguage(this.model),
        () => this.sortAlphabetically,
        () => this.isEditing()
      ],
      () => setProperties());

    this.addPropertyActions = [
      {
        name: 'Add property',
        apply: () => this.addProperty()
      },
      {
        name: 'Copy properties from class',
        apply: () => this.copyPropertiesFromClass()
      }
    ];
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  get shouldAutoFocus() {
    return !isDefined(this.classView);
  }

  get sortAlphabetically() {
    return this.sessionService.sortAlphabetically || false;
  }

  set sortAlphabetically(value: boolean) {
    this.sessionService.sortAlphabetically = value;
  }

  addProperty() {
    this.searchPredicateModal.openAddProperty(this.model, this.class)
      .then(property => {
        this.class.addProperty(property);
        this.openPropertyId = property.internalId.uuid;
      }, modalCancelHandler);
  }

  copyPropertiesFromClass() {
    this.searchClassModal.openWithOnlySelection(this.model, false, noExclude, _klass => 'Copy properties')
      .then(selectedClass => this.addPropertiesFromClass(selectedClass, 'class'), modalCancelHandler);
  }

  addPropertiesFromClass(klass: Class, classType: string) {
    if (klass && klass.properties.length > 0) {

      const existingPredicates = new Set<string>(this.class.properties.map(property => property.predicateId.uri));
      const exclude = (property: Property) => existingPredicates.has(property.predicateId.uri);

      this.addPropertiesFromClassModal.open(klass, classType, this.model, exclude)
        .then(properties => properties.forEach((property: Property) => this.class.addProperty(property)));
    }
  }

  addPropertiesFromClassId(id: Uri, classType: string) {
    this.classService.getInternalOrExternalClass(id, this.model)
      .then(klassOrNull => {
        const klass = requireDefined(klassOrNull); // TODO check if class can actually be null
        this.addPropertiesFromClass(klass, classType)
      });
  }

  linkToIdClass() {
    return this.model.linkToResource(this.class.id);
  }

  linkToSuperclass() {
    return this.model.linkToResource(this.class.subClassOf);
  }

  linkToScopeclass() {
    return this.model.linkToResource(this.class.scopeClass);
  }

  formLabelNameToIdName(label: Localizable) {
    return labelNameToResourceIdIdentifier(this.languageService.translate(label));
  }
}
