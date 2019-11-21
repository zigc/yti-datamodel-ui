import { ILocationService, IPromise, IQService, IScope } from 'angular';
import * as _ from 'lodash';
import { ClassService, RelatedClass } from '../../services/classService';
import { LanguageService, Localizer } from '../../services/languageService';
import { LocationService } from '../../services/locationService';
import { ModelService } from '../../services/modelService';
import { PredicateService, RelatedPredicate } from '../../services/predicateService';
import { ConfirmationModal } from '../../components/common/confirmationModal';
import { SearchClassModal } from '../../components/editor/searchClassModal';
import { SearchClassTableModal, noClassExclude } from '../../components/editor/searchClassTableModal';
import { SearchPredicateModal } from '../../components/editor/searchPredicateModal';
import { EntityCreation } from '../../components/editor/searchConceptModal';
import { ClassType, KnownPredicateType, SelectionType, WithDefinedBy } from '../../types/entity';
import { ChangeListener, ChangeNotifier, SearchClassType } from '../../types/component';
import { Uri } from '../../entities/uri';
import { comparingLocalizable } from '../../utils/comparator';
import { AddPropertiesFromClassModal } from '../../components/editor/addPropertiesFromClassModal';
import { LegacyComponent, modalCancelHandler } from '../../utils/angular';
import {
  combineExclusions,
  createClassTypeExclusion,
  createDefinedByExclusion,
  createExistsExclusion,
  Exclusion
} from '../../utils/exclusion';
import { collectIds, glyphIconClassForType } from '../../utils/entity';
import { areEqual, Optional } from 'yti-common-ui/utils/object';
import { AbstractPredicate, Predicate, PredicateListItem } from '../../entities/predicate';
import { AbstractClass, Class, ClassListItem, Property } from '../../entities/class';
import { Model } from '../../entities/model';
import { ExternalEntity } from '../../entities/externalEntity';
import { NotificationModal } from '../../components/common/notificationModal';
import { removeMatching } from 'yti-common-ui/utils/array';
import { EditorContainer, ModelControllerService } from './modelControllerService';
import { AuthorizationManagerService } from '../../services/authorizationManagerService';
import { SearchPredicateTableModal, noPredicateExclude } from '../editor/searchPredicateTableModal';
import { ModelAndSelection } from '../../services/subRoutingHackService';
import { BehaviorSubject, Subscription } from 'rxjs';


export interface ModelPageActions extends ChangeNotifier<Class | Predicate> {
  selectResource(item: WithIdAndType): void;

  createClass(conceptCreation: EntityCreation): void;
  createRelatedClass(relatedClass: RelatedClass): void;

  createShape(classOrExternal: Class | ExternalEntity, external: boolean): void;

  copyShape(shape: Class): void;

  assignClassToModel(klass: Class): void;

  createPredicate(conceptCreation: EntityCreation, type: KnownPredicateType): void;
  createRelatedPredicate(relatedPredicate: RelatedPredicate): void;

  assignPredicateToModel(predicate: Predicate): void;
}

@LegacyComponent({
  bindings: {
    currentSelection: '<',
    makeSelection: '&',
    updateNamespaces: '&',
    parent: '<'
  },
  template: require('./modelPage.html')
})
export class ModelPageComponent implements ModelPageActions, ModelControllerService {

  currentSelection: BehaviorSubject<ModelAndSelection>;
  makeSelection: (selection: { resourceCurie?: string, propertyId?: string }) => void;
  updateNamespaces: (namespacesInUse: Set<string>) => void;
  parent: EditorContainer;
  subscriptions: Subscription[] = [];

  model: Model;
  resource?: Class | Predicate;
  propertyId?: string;

  loadingResource?: WithIdAndType;
  loadingResourcePromise?: IPromise<Class | Predicate>;

  changeListeners: ChangeListener<Class | Predicate>[] = [];
  classes: SelectableItem[] = [];
  associations: SelectableItem[] = [];
  attributes: SelectableItem[] = [];
  namespacesInUse: Set<string> = new Set<string>();
  selectionWidth: number;
  visualizationMaximized = false;

  activeTab = 0;
  tabs = [
    new Tab('class', () => this.classes, this),
    new Tab('attribute', () => this.attributes, this),
    new Tab('association', () => this.associations, this)
  ];

  constructor($scope: IScope,
              $location: ILocationService,
              private $q: IQService,
              private locationService: LocationService,
              private modelService: ModelService,
              private classService: ClassService,
              private predicateService: PredicateService,
              private searchClassModal: SearchClassModal,
              private searchClassTableModal: SearchClassTableModal,
              private searchPredicateModal: SearchPredicateModal,
              private searchPredicateTableModal: SearchPredicateTableModal,
              private confirmationModal: ConfirmationModal,
              private notificationModal: NotificationModal,
              private addPropertiesFromClassModal: AddPropertiesFromClassModal,
              public languageService: LanguageService,
              private authorizationManagerService: AuthorizationManagerService) {
    'ngInject';

    $scope.$watch(() => this.model && this.languageService.getModelLanguage(this.model), () => {
      if (this.model) {
        this.sortAll();
      }
    });

    $scope.$watch(() => this.propertyId, (newId: string, oldId: string) => {
      // Cope with situation where there is an entity under creation, but the currentSelection still has old values.
      if (this.resource && this.resource.id) {
        const current = this.currentSelection.getValue();
        let curieMatches = false;
        try {
          curieMatches = this.resource.id.curie === current.resourceCurie;
        } catch (error) {}

        if (curieMatches && oldId === current.propertyId && oldId !== newId) {
          this.makeSelection({ resourceCurie: current.resourceCurie, propertyId: newId });
        }
      }
    });

    $scope.$watch(() => this.resource, () => {
      this.alignTabWithSelection();
      for (const changeListener of this.changeListeners) {
        changeListener.onResize();
      }
    });

    $scope.$watch(() => this.selectionWidth, () => {
      for (const changeListener of this.changeListeners) {
        changeListener.onResize();
      }
    });

    $scope.$watch(() => this.visualizationMaximized, maximized => {

      const body = jQuery('body');

      if (maximized) {
        body.addClass('visualization-maximized');
      } else {
        body.removeClass('visualization-maximized');
      }
    });
  }

  get visualizationWidth() {
    return this.resource ? `calc(100% - ${this.selectionWidth}px)` : '100%';
  }

  get selectableItemComparator() {
    return comparingLocalizable<SelectableItem>(this.localizerProvider(), selectableItem => selectableItem.item.label);
  }

  $onInit() {
    this.subscriptions.push(this.currentSelection.subscribe(newModelAndSelection => {
      if (newModelAndSelection.model) {
        const modelChanged = !this.model || this.model.prefix !== newModelAndSelection.model.prefix;
        this.model = newModelAndSelection.model;
        this.obeySelectionChange(modelChanged, newModelAndSelection.resourceCurie, newModelAndSelection.propertyId);
      } else {
        // NOTE: This component will be destroyed instantaneously, and currently this.model is not optional. So let us do nothing.
      }
    }));

    this.subscriptions.push(this.modelService.contentExpired$.subscribe(modelId => {
      if (this.model.id.uri === modelId) {
        this.updateSelection();
      }
     }));
  }

  $onDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  addListener(listener: ChangeListener<Class | Predicate>) {
    this.changeListeners.push(listener);
  }

  sortAll() {
    this.sortClasses();
    this.sortPredicates();
  }

  sortClasses() {
    this.classes.sort(this.selectableItemComparator);
    setOverlaps(this.classes);
  }

  sortPredicates() {
    this.associations.sort(this.selectableItemComparator);
    this.attributes.sort(this.selectableItemComparator);
    setOverlaps(this.associations);
    setOverlaps(this.attributes);
  }

  isSelected(selection: SelectableItem) {
    return selection.matchesIdentity(this.resource);
  }

  isLoading(listItem: SelectableItem) {
    return matchesIdentity(listItem, this.loadingResource) && !matchesIdentity(listItem, this.resource);
  }

  canEdit(): boolean {
    return this.model && this.authorizationManagerService.canEditModel(this.model);
  }

  selectionEdited(oldSelection: Class | Predicate | null, newSelection: Class | Predicate) {
    this.updateSelectables();

    for (const changeListener of this.changeListeners) {
      changeListener.onEdit(newSelection, oldSelection);
    }

    if (!oldSelection && newSelection) {
      this.selectResource(newSelection);
    }
  }

  selectionDeleted(selection: Class | Predicate) {
    removeMatching(this.classes, item => matchesIdentity(item, selection));
    removeMatching(this.attributes, item => matchesIdentity(item, selection));
    removeMatching(this.associations, item => matchesIdentity(item, selection));

    for (const changeListener of this.changeListeners) {
      changeListener.onDelete(selection);
    }
    this.makeSelection({});
  }

  public addEntity(type: ClassType | KnownPredicateType) {
    if (type === 'class' || type === 'shape') {
      if (this.model.isOfType('profile')) {
        // profiles can create multiple shapes of single class so exists exclusion is not wanted
        // profiles can create copy of shapes so type exclusion is not wanted
        return this.addClass(createDefinedByExclusion(this.model), noClassExclude);
      } else {
        return this.addClass(
          combineExclusions<AbstractClass>(
            createClassTypeExclusion(SearchClassType.Class),
            createDefinedByExclusion(this.model),
            createExistsExclusion(collectIds(this.classes))),
          createClassTypeExclusion(SearchClassType.Class)
        );
      }
    } else {
      this.addPredicate(
        type,
        combineExclusions<AbstractPredicate>(
          createExistsExclusion(collectIds([this.attributes, this.associations])),
          createDefinedByExclusion(this.model)),
        noPredicateExclude
      );
    }
  }

  selectNewlyCreatedOrAssignedEntity<T extends Class | Predicate>(entity: T) {

    this.loadingResource = undefined;
    this.loadingResourcePromise = undefined;

    if (!entity.unsaved) {
      this.updateSelectables();
      this.selectResource(entity);

      for (const changeListener of this.changeListeners) {
        changeListener.onAssign(entity);
      }
    } else {
      this.resource = entity;
    }
  }

  createClass(conceptCreation: EntityCreation) {
    this.classService.newClass(this.model, conceptCreation.entity.label, conceptCreation.conceptId, this.languageService.getModelLanguage(this.model))
      .then(klass => this.selectNewlyCreatedOrAssignedEntity(klass));
  }

  createRelatedClass(relatedClass: RelatedClass) {
    this.classService.newRelatedClass(this.model, relatedClass)
      .then(klass => this.selectNewlyCreatedOrAssignedEntity(klass));
  }

  createShape(classOrExternal: Class | ExternalEntity, external: boolean) {

    this.classService.newShape(classOrExternal, this.model, external, this.languageService.getModelLanguage(this.model))
      .then(shape => {
        if (shape.properties.length > 0) {
          return this.$q.all([this.$q.when(shape), this.addPropertiesFromClassModal.open(shape, external ? 'external class' : 'scope class', this.model)]);
        } else {
          return this.$q.when([shape, shape.properties]);
        }
      })
      .then(([shape, properties]: [Class, Property[]]) => {
        shape.properties = properties;
        this.selectNewlyCreatedOrAssignedEntity(shape);
      });
  }

  copyShape(shape: Class) {
    if (!this.model.isOfType('profile')) {
      throw new Error('Shapes can be copied only to profile');
    }

    const copiedShape = shape.copy(this.model);
    this.selectNewlyCreatedOrAssignedEntity(copiedShape);
  }

  assignClassToModel(klass: Class) {
    return this.classService.assignClassToModel(klass.id, this.model)
      .then(() => this.selectNewlyCreatedOrAssignedEntity(klass));
  }

  createPredicate(conceptCreation: EntityCreation, type: KnownPredicateType) {
    return this.predicateService.newPredicate(this.model, conceptCreation.entity.label, conceptCreation.conceptId, type, this.languageService.getModelLanguage(this.model))
      .then(predicate => this.selectNewlyCreatedOrAssignedEntity(predicate));
  }

  createRelatedPredicate(relatedPredicate: RelatedPredicate) {
    return this.predicateService.newRelatedPredicate(this.model, relatedPredicate)
      .then(predicate => this.selectNewlyCreatedOrAssignedEntity(predicate));
  }

  assignPredicateToModel(predicate: Predicate) {
    return this.predicateService.assignPredicateToModel(predicate.id, this.model)
      .then(() => this.selectNewlyCreatedOrAssignedEntity(predicate));
  }

  selectResource(item: WithIdAndType) {
    // Here we (or sub components) initiate a selection change. The actual change happens through the routing stuff.

    if (item) {
      this.makeSelection({ resourceCurie: item.id.curie });
    } else {
      this.makeSelection({});
    }
  }

  private obeySelectionChange(modelChanged: boolean, resourceCurie?: string, propertyId?: string) {
    // Here we obey the instructions received from routing (through parent components), i.e., actually perform the change.

    const selectionChanged = !areEqual((this.resource && this.resource.id.curie), resourceCurie);
    const resourceNotFoundHandler = () => this.notificationModal.openResourceNotFound(this.model);
    this.propertyId = propertyId; // NOTE: This does not cause loading, so we may just set the new value. (Even though it may not yet be found.)

    if (modelChanged || selectionChanged) {
      const promises: IPromise<any>[] = [];
      promises.push(this.resourceCurieToId(resourceCurie).then(idWithTypeOrUndefined => {
        if (idWithTypeOrUndefined) {
          return this.fetchResource(idWithTypeOrUndefined);
        } else {
          return this.$q.resolve(undefined);
        }
      }).then(value => {
        this.resource = value;
      }));
      if (modelChanged) {
        promises.push(this.updateSelectables());
      }
      this.$q.all(promises).then(() => this.updateLocation())
        .catch(err => {
          console.log('Selection change failed: ' + err);
          resourceNotFoundHandler();
        });
    }
  }

  private resourceCurieToId(resourceCurie?: string): IPromise<WithIdAndType | undefined> {
    if (this.model) {
      if (resourceCurie) {
        const resourceUri = new Uri(resourceCurie, this.model.context);
        const startsWithCapital = /^([A-Z]).*/.test(resourceUri.name);
        const selectionType: SelectionType = startsWithCapital ? 'class' : 'predicate';

        if (resourceUri.resolves()) {
          return this.$q.resolve({
            id: resourceUri,
            selectionType
          });
        } else {
          const prefix = resourceCurie.split(':')[0];
          return this.modelService.getModelByPrefix(prefix).then(model => ({
            id: new Uri(resourceCurie, model.context),
            selectionType
          }));
        }
      } else if (this.model.rootClass) {
        return this.$q.resolve({ id: this.model.rootClass, selectionType: 'class' as SelectionType });
      }
    }
    return this.$q.resolve(undefined);
  }

  private updateLocation() {
    if (this.model) {
      this.locationService.atModel(this.model, this.resource ? this.resource : null);
    }
  }

  private addClass(exclusion: Exclusion<AbstractClass>,
                   filterExclusion: Exclusion<AbstractClass>) {

    const isProfile = this.model.isOfType('profile');
    const textForSelection = (klass: Optional<Class>) => {
      if (isProfile) {
        if (klass && klass instanceof Class && klass.isOfType('shape')) {
          return 'Copy shape';
        } else {
          return 'Specialize class';
        }
      } else {
        return 'Use class';
      }
    };

    // OLD FEATURE: Search class modal
    // const searchClassModal = () => this.searchClassModal.open(this.model, exclusion, textForSelection);

    // CURRENT FEATURE: Search class table view modal - eJira issue: YTI-304 (old Jira: YTI-546)
    const searchClassModal = () => this.searchClassTableModal.open(this.model, exclusion, filterExclusion, textForSelection, collectIds(this.classes));

    this.createOrAssignEntity(
      () => searchClassModal(),
      (external: ExternalEntity) => {
        if (isProfile) {
          this.createShape(external, true);
        } else {
          this.$q.reject('Library does not support external');
        }
      },
      (concept: EntityCreation) => this.createClass(concept),
      (klass: Class|RelatedClass) => {
        if (klass instanceof Class) {
          if (klass.unsaved) {
            this.selectNewlyCreatedOrAssignedEntity(klass);
          } else if (klass.isOfType('shape')) {
            this.copyShape(klass);
          } else if (isProfile) {
            this.createShape(klass, klass.external);
          } else {
            this.assignClassToModel(klass).then(() => klass);
          }
        } else {
          this.createRelatedClass(klass);
        }
      }
    );
  }

  private addPredicate(type: KnownPredicateType, exclusion: Exclusion<AbstractPredicate>, filterExclusion: Exclusion<AbstractPredicate>) {

    // OLD FEATURE: Search predicate modal
    // const searchPredicateModal = () => this.searchPredicateModal.openAddPredicate(this.model, type, exclusion);

    // CURRENT FEATURE: Search predicate table view modal
    const searchPredicateModal = () => this.searchPredicateTableModal.openAddPredicate(this.model, type, exclusion, filterExclusion, collectIds([this.attributes, this.associations]));

    this.createOrAssignEntity(
      () => searchPredicateModal(),
      (_external: ExternalEntity) => this.$q.reject('Unsupported operation'),
      (concept: EntityCreation) => this.createPredicate(concept, type),
      (predicate: Predicate|RelatedPredicate) => {
        if (predicate instanceof Predicate) {
          this.assignPredicateToModel(predicate);
        } else {
          this.createRelatedPredicate(predicate);
        }
      }
    );
  }

  private createOrAssignEntity<T extends Class | Predicate | RelatedClass | RelatedPredicate>(modal: () => IPromise<ExternalEntity | EntityCreation | T>,
                                                                                              fromExternalEntity: (external: ExternalEntity) => void,
                                                                                              fromConcept: (concept: EntityCreation) => void,
                                                                                              fromEntity: (entity: T) => void) {

    this.askPermissionWhenEditing(() => {
      modal().then(result => {
        if (result instanceof EntityCreation) {
          fromConcept(result);
        } else if (result instanceof ExternalEntity) {
          fromExternalEntity(result);
        } else {
          fromEntity(<T>result);
        }
      }, modalCancelHandler);
    });
  }

  private findEditingViews() {
    return this.parent.editingViews();
  }

  private askPermissionWhenEditing(callback: () => void) {
    const editingViews = this.findEditingViews();
    if (editingViews.length > 0) {
      this.confirmationModal.openEditInProgress().then(() => {
        editingViews.forEach(view => view.cancelEditing());
        callback();
      }, modalCancelHandler);
    } else {
      callback();
    }
  }

  // TODO remove retrying when data is coherent
  private fetchResource(resourceIdAndType: WithIdAndType, isRetry: boolean = false): IPromise<Class | Predicate> {

    if (matchesIdentity(this.loadingResource, resourceIdAndType) && this.loadingResourcePromise) {
      return this.loadingResourcePromise;
    }

    if (matchesIdentity(resourceIdAndType, this.resource) && this.resource) {
      this.loadingResource = undefined;
      this.loadingResourcePromise = undefined;
      return this.$q.resolve(this.resource);
    }

    // set selected item also here for showing selection before entity actually is loaded
    this.loadingResource = resourceIdAndType;

    return this.doFetchResource(resourceIdAndType)
      .catch(reason => {
        if (!isRetry) {
          return this.fetchResource({
            id: resourceIdAndType.id,
            selectionType: resourceIdAndType.selectionType === 'class' ? 'predicate' : 'class'
          }, true);
        } else {
          return this.$q.reject('resource not found');
        }
      }).finally(() => {
        this.loadingResource = undefined;
        this.loadingResourcePromise = undefined;
      });
  }

  private doFetchResource(resourceIdAndType: WithIdAndType): IPromise<Class | Predicate> {
    return resourceIdAndType.selectionType === 'class'
      ? this.classService.getClass(resourceIdAndType.id, this.model)
      : this.predicateService.getPredicate(resourceIdAndType.id, this.model);
  }

  private alignTabWithSelection() {

    if (this.resource) {
      const tabType = this.resource instanceof Predicate ? this.resource.normalizedType : 'class';

      for (let i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].type === tabType) {
          this.activeTab = i;
          break;
        }
      }
    } else {
      // do not change tab after, e.g., deletion
    }
  }

  private updateSelectables(): IPromise<any> {
    return this.$q.all([this.updateClasses(), this.updatePredicates()])
      .then(() => {

        const resources: WithDefinedBy[] = [
          ...this.associations,
          ...this.attributes,
          ...this.classes
        ];

        this.namespacesInUse.clear();

        for (const resource of resources) {
          if (resource.definedBy) {
            this.namespacesInUse.add(resource.definedBy!.id.uri);
          }
        }

        this.updateNamespaces(this.namespacesInUse);
      });
  }

  private updateSelection() {
    if (this.resource) {

      if (this.resource.selectionType === 'class') {

        this.classService.getClass(this.resource.id, this.model)
        .then(resource => {
          if (this.resource instanceof Class && resource instanceof Class) {
            this.resource.status = resource.status;
            this.resource.properties = resource.properties;
          }
        });
      } else {
        this.predicateService.getPredicate(this.resource.id, this.model)
        .then(resource => {
          if (this.resource instanceof Predicate && resource instanceof Predicate) {
            this.resource.status = resource.status;
          }
        });
      }
    }
  }

  private updateClasses(): IPromise<any> {
    return this.classService.getClassesAssignedToModel(this.model)
      .then(classes => {
        this.classes = classes.map(klass => new SelectableItem(klass, this));
        this.sortClasses();
      });
  }

  private updatePredicates(): IPromise<any> {
    return this.predicateService.getPredicatesAssignedToModel(this.model)
      .then(predicates => {
        this.attributes = _.chain(predicates)
          .filter(predicate => predicate.isOfType('attribute'))
          .map(attribute => new SelectableItem(attribute, this))
          .value();
        this.associations = _.chain(predicates)
          .filter(predicate => predicate.isOfType('association'))
          .map(association => new SelectableItem(association, this))
          .value();
        this.sortPredicates();
      });
  }

  private localizerProvider(): Localizer {
    return this.languageService.createLocalizer(this.model);
  }
}

class Tab {

  addLabel: string;
  glyphIconClass: any;
  addNew: () => void;

  constructor(public type: ClassType | KnownPredicateType, public items: () => SelectableItem[], modelController: ModelPageComponent) {
    this.addLabel = 'Add ' + type;
    this.glyphIconClass = glyphIconClassForType([type]);
    this.addNew = () => modelController.addEntity(type);
  }
}


interface WithIdAndType {
  id: Uri;
  selectionType: SelectionType;
}

function matchesIdentity(lhs: WithIdAndType | null | undefined, rhs: WithIdAndType | null | undefined) {
  return areEqual(lhs, rhs, (l, r) => l.selectionType === r.selectionType && l.id.equals(r.id));
}

function setOverlaps(items: SelectableItem[]) {
  let previous: SelectableItem | undefined;
  for (const item of items) {
    if (previous && previous.rawLabel === item.rawLabel) {
      previous.hasOverlap = true;
      item.hasOverlap = true;
    } else {
      item.hasOverlap = false;
    }
    previous = item;
  }
}

class SelectableItem implements WithDefinedBy {

  hasOverlap = false;

  constructor(public item: ClassListItem | PredicateListItem, private modelController: ModelPageComponent) {
  }

  get id(): Uri {
    return this.item.id;
  }

  get rawLabel(): string {
    return this.modelController.languageService.translate(this.item.label, this.modelController.model);
  }

  get label(): string {
    return this.rawLabel + (this.hasOverlap ? ` (${this.id.compact})` : '');
  }

  get definedBy() {
    return this.item.definedBy;
  }

  get selectionType() {
    return this.item.selectionType;
  }

  matchesIdentity(obj: WithIdAndType | null | undefined) {
    return matchesIdentity(this.item, obj);
  }
}
