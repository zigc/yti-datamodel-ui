import { IPromise, IQService, IScope, ITimeoutService, IWindowService } from 'angular';
import { LanguageService } from 'app/services/languageService';
import { ClassVisualization, VisualizationService } from 'app/services/visualizationService';
import { ClassInteractionListener, Coordinate, Dimensions } from 'app/types/visualization';
import { ChangeListener } from 'app/types/component';
import * as joint from 'jointjs';
import { Uri } from 'app/entities/uri';
import { arraysAreEqual, firstMatching, normalizeAsArray } from 'yti-common-ui/utils/array';
import { UserService } from 'app/services/userService';
import { ConfirmationModal } from 'app/components/common/confirmationModal';
import { FocusLevel, NameType, SessionService } from 'app/services/sessionService';
import { VisualizationPopoverDetails } from './popover';
import { createAssociationLink, createClassElement, ShadowClass } from './diagram';
import { PaperHolder } from './paperHolder';
import { centerToElement, focusElement, moveOrigin, scale, scaleToFit } from './paperUtil';
import { adjustElementLinks, calculateLabelPosition, layoutGraph, VertexAction } from './layout';
import { Localizer } from 'app/types/language';
import { ComponentDeclaration, ifChanged, modalCancelHandler } from 'app/utils/angular';
import { centerToPosition, coordinatesAreEqual, copyVertices } from 'app/utils/entity';
import { mapOptional, Optional, requireDefined } from 'yti-common-ui/utils/object';
import { Class, Property } from 'app/entities/class';
import { Predicate } from 'app/entities/predicate';
import { Model } from 'app/entities/model';
import { AssociationPropertyPosition, AssociationTargetPlaceholderClass, ModelPositions, VisualizationClass } from 'app/entities/visualization';
import { InteractiveHelpService } from 'app/help/services/interactiveHelpService';
import * as moment from 'moment';
import { ContextMenuTarget } from './contextMenu';
import { ModelPageActions } from 'app/components/model/modelPage';
import { AuthorizationManagerService } from 'app/services/authorizationManagerService';
import { forwardRef, NgZone } from '@angular/core';

export const ClassVisualizationComponent: ComponentDeclaration = {
  selector: 'classVisualization',
  bindings: {
    selection: '=',
    model: '=',
    modelPageActions: '=',
    maximized: '='
  },
  template: `
     <div class="visualization-buttons">
       
       <button id="maximize_button"
               ng-if="!ctrl.maximized" 
               class="btn btn-link btn-lg pull-right pt-0 pb-0 pr-0"
               uib-tooltip="{{'Maximize' | translate}}"
               tooltip-placement="left"
               ng-click="$ctrl.maximized = true">
        <i class="fas fa-window-maximize"></i>
       </button>
       
       <button id="minimize_button"
               ng-if="$ctrl.maximized" 
               class="btn btn-secondary-action btn-lg pull-right pl-1 pt-0 pb-0 pr-1 mr-3"
               uib-tooltip="{{'Minimize' | translate}}"
               tooltip-placement="left"
               ng-click="$ctrl.maximized = false">
        <i class="fas fa-window-minimize"></i>
       </button>
       
       <button id="zoom_out_button"
               class="btn btn-secondary-action btn-sm" 
               ng-mousedown="$ctrl.zoomOut()" 
               ng-mouseup="$ctrl.zoomOutEnded()">
         <i class="fas fa-search-minus"></i>
       </button>
       
       <button id="zoom_in_button"
               class="btn btn-secondary-action btn-sm" 
               ng-mousedown="$ctrl.zoomIn()" 
               ng-mouseup="$ctrl.zoomInEnded()">
         <i class="fas fa-search-plus"></i>
       </button>
       
       <button id="fit_to_content_button"
               class="btn btn-secondary-action btn-sm" 
               ng-click="$ctrl.fitToContent()">
         <i class="fas fa-arrows-alt"></i>
       </button>
       
       <button id="center_to_selected_class_button"
               ng-show="$ctrl.canFocus()" 
               class="btn btn-secondary-action btn-sm" 
               ng-click="$ctrl.centerToSelectedClass()">
         <i class="fas fa-crosshairs"></i>
       </button>
       
       <span ng-show="$ctrl.canFocus()">
         <button id="focus_out_button"
                 class="btn btn-secondary-action btn-sm" 
                 ng-click="$ctrl.focusOut()">
           <i class="fas fa-angle-left"></i>
         </button>
         <div class="focus-indicator">
           <i>{{$ctrl.renderSelectionFocus()}}</i>
         </div>
         <button id="focus_in_button"
                 class="btn btn-secondary-action btn-sm" 
                 ng-click="$ctrl.focusIn()">
           <i class="fas fa-angle-right"></i>
         </button>
       </span>
       
       <button id="toggle_show_name_button"
               class="btn btn-secondary-action btn-sm" 
               ng-click="$ctrl.toggleShowName()">
         <i>{{$ctrl.showNameLabel | translate}}</i>
       </button>
       
       <button id="save_positions_button"
               class="btn btn-secondary-action btn-sm" 
               ng-show="$ctrl.canSave()" 
               ng-disabled="$ctrl.modelPositions.isPristine()" 
               ng-click="$ctrl.savePositions()">
        <i class="fas fa-save"></i>
       </button>
       
       <button id="layout_persistent_positions_button"
               class="btn btn-secondary-action btn-sm" 
               ng-disabled="$ctrl.saving" 
               ng-click="$ctrl.layoutPersistentPositions()" 
               ng-context-menu="$ctrl.relayoutPositions()">
        <i class="fas fa-sync-alt"></i>
       </button>
       
       <div uib-dropdown is-open="$ctrl.exportOpen" ng-if="$ctrl.downloads" class="d-inline-block">
         <button id="download_dropdown" class="btn btn-secondary-action btn-sm dropdown-toggle" uib-dropdown-toggle>
           <i class="fas fa-download" />
         </button>
         <div uib-dropdown-menu>
           <a id="{{download.name + '_download_dropdown'}}"
              class="dropdown-item" 
              ng-repeat="download in $ctrl.downloads"
              target="_self" 
              download="{{download.filename}}" 
              ng-href="{{download.href}}" 
              ng-click="download.onClick()">
             {{download.name}}
           </a>
         </div>
       </div>
     </div>
     
     <canvas style="display:none; background-color: white"></canvas>
     
     <visualization-popover details="$ctrl.popoverDetails" context="$ctrl.model"></visualization-popover>
     
     <visualization-context-menu ng-if="$ctrl.contextMenuTarget" 
                                 target="$ctrl.contextMenuTarget" 
                                 model="$ctrl.model" 
                                 model-page-actions="$ctrl.modelPageActions"></visualization-context-menu>
                                 
     <ajax-loading-indicator ng-if="$ctrl.loading"></ajax-loading-indicator>
    `,
  controller: forwardRef(() => ClassVisualizationController)

};

class ClassVisualizationController implements ChangeListener<Class|Predicate>, ClassInteractionListener {

  selection: Class|Predicate;

  model: Model;
  modelPageActions: ModelPageActions;

  loading: boolean;

  zoomInHandle: number;
  zoomOutHandle: number;

  dimensionChangeInProgress: boolean;

  paperHolder: PaperHolder;

  visible = true;
  saving = false;
  operationQueue: (() => void)[] = [];

  classVisualization: ClassVisualization;
  persistentPositions: ModelPositions;

  refreshDimensions: () => void;

  popoverDetails: VisualizationPopoverDetails|null;

  localizer: Localizer;

  clickType: 'left'|'right' = 'left';
  contextMenuTarget: Optional<ContextMenuTarget>;

  exportOpen = false;
  svg: () => SVGElement;
  canvas: HTMLCanvasElement;
  downloads: Download[];

  maximized: boolean;

  /* @ngInject */
  constructor(private $scope: IScope,
              private $q: IQService,
              private $timeout: ITimeoutService,
              private $window: IWindowService,
              private $element: JQuery,
              private zone: NgZone,
              private visualizationService: VisualizationService,
              private languageService: LanguageService,
              private userService: UserService,
              private sessionService: SessionService,
              private interactiveHelpService: InteractiveHelpService,
              private confirmationModal: ConfirmationModal,
              private authorizationManagerService: AuthorizationManagerService) {
  }

  $onInit() {

    this.paperHolder = new PaperHolder(this.$element, this, this.$window, this.zone);
    this.svg = () => this.$element.find('svg')[0] as any as SVGElement;
    this.canvas = this.$element.find('canvas')[0] as HTMLCanvasElement;

    const visualizationViewElement = this.$element.closest('visualization-view');

    const currentDimensions = () => ({
      width: visualizationViewElement.width(),
      height: visualizationViewElement.height()
    });

    const refreshDimensionsWaitingToStabilize = (initial: Dimensions) => {

      const paper = this.paper;

      const isDimensionChanged = (lhs: Dimensions, rhs: Dimensions) =>
        lhs.width !== rhs.width || lhs.height !== rhs.height;

      const previous = { width: paper.options.width!, height: paper.options.height! };
      const current = currentDimensions();

      if (isDimensionChanged(previous, current)) {
        paper.setDimensions(current.width, current.height);
        window.setTimeout(() => refreshDimensionsWaitingToStabilize(initial));
      } else {
        moveOrigin(paper, (initial.width - current.width) / 2, (initial.height - current.height) / 2);
        this.dimensionChangeInProgress = false;
      }
    };

    const refreshDimensions = () => {
      if (!this.dimensionChangeInProgress) {

        this.dimensionChangeInProgress = true;
        const initial = currentDimensions();

        window.setTimeout(() =>
          refreshDimensionsWaitingToStabilize(initial));
      }
    };

    const setClickType = (event: MouseEvent) => this.clickType = event.which === 3 ? 'right' : 'left';

    // init
    this.refreshDimensions = () => window.setTimeout(refreshDimensions);

    this.zone.runOutsideAngular(() => {
      window.addEventListener('resize', refreshDimensions);
      this.$scope.$watch(() => this.maximized, refreshDimensions);
      window.addEventListener('mousedown', setClickType);
    });

    this.$scope.$on('$destroy', () => {
      window.removeEventListener('resize', refreshDimensions);
      window.removeEventListener('mousedown', setClickType);
    });

    this.modelPageActions.addListener(this);

    this.$scope.$watch(() => this.model, () => this.refresh());
    this.$scope.$watch(() => this.selection, ifChanged((newSelection, oldSelection) => {
      if (!newSelection || !oldSelection) {
        // Need to do this on next frame since selection change will change visualization size
        window.setTimeout(() => this.queueWhenNotVisible(() => this.focusSelection(false)));
      } else {
        this.focusSelection(false);
      }
    }));
    this.$scope.$watch(() => this.selectionFocus, ifChanged(() => this.focusSelection(false)));

    if (Modernizr.bloburls) {
      this.downloads = []; // set as empty array which indicates that exports are supported
      this.$scope.$watch(() => this.exportOpen, open => {
        if (open) {
          this.revokePreviousDownloads();
          this.generateExports().then(downloads => this.downloads = downloads);
        }
      });

      this.$scope.$on('$destroy', () => this.revokePreviousDownloads());
    }

    this.$scope.$on('$destroy', () => this.paperHolder.clean());
  }

  revokePreviousDownloads() {
    for (const download of this.downloads) {
      this.$window.URL.revokeObjectURL(download.href);
    }
  }

  generateExports(): IPromise<Download[]> {

    const UTF8_BOM = '\ufeff';
    const svgBlob = new Blob([UTF8_BOM, this.svgToString()], { type: 'image/svg+xml;charset=utf-8' });

    const filenameForExtension = (extension: string) =>
      `${this.model.prefix}-visualization-${moment().format('YYYY-MM-DD')}.${extension.toLowerCase()}`;

    const createDownload = (blob: Blob, extension: string) => {
      return {
        name: extension.toUpperCase(),
        filename: filenameForExtension(extension),
        href: this.$window.URL.createObjectURL(blob),
        onClick: () => {
          if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, filenameForExtension(extension));
          }
        }
      };
    };

    return this.svgToPng(svgBlob)
      .then(pngBlob => [createDownload(pngBlob, 'png'), createDownload(svgBlob, 'svg')],
        _err => [createDownload(svgBlob, 'svg')]);
  }

  svgToPng(svgBlob: Blob): IPromise<Blob> {

    const deferred = this.$q.defer<Blob>();
    const canvas = this.canvas;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const svgURL = this.$window.URL.createObjectURL(svgBlob);

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    img.onload = () => {

      // Timeout hack for IE which incorrectly calls onload even when loading isn't actually ready
      setTimeout(() => {

        ctx.drawImage(img, 0, 0);
        this.$window.URL.revokeObjectURL(svgURL);

        try {
          canvas.toBlob(pngBlob => {
            if (pngBlob) {
              deferred.resolve(pngBlob);
            } else {
              deferred.reject('Null result');
            }
          }, 'image/png');
        } catch (e) {
          console.log('Cannot export PNG');
          deferred.reject(e);
        }
      });
    };

    img.src = svgURL;

    return deferred.promise;
  }

  svgToString() {
    // brutal way to inject styles to the document but creating new dom hierarchy seems to be impossible to get to work with IE
    return new XMLSerializer().serializeToString(this.svg())
      .replace('</svg>', '<style>' + require('!raw-loader!sass-loader!../../../styles/classVisualizationSvgExport.scss') + '</style></svg>');
  }

  get selectionFocus() {
    return this.sessionService.visualizationFocus || FocusLevel.ALL;
  }

  set selectionFocus(value: FocusLevel) {
    this.sessionService.visualizationFocus = value;
  }

  get showName() {
    return this.sessionService.showName || NameType.LABEL;
  }

  set showName(value: NameType) {
    this.sessionService.showName = value;
  }

  get paper(): joint.dia.Paper {
    return this.paperHolder.getPaper(this.model);
  }

  get graph(): joint.dia.Graph {
    return <joint.dia.Graph> this.paper.model;
  }

  get modelPositions() {
    return this.classVisualization && this.classVisualization.positions;
  }

  canSave() {
    return this.interactiveHelpService.isClosed() && this.authorizationManagerService.canSaveVisualization(this.model);
  }

  savePositions() {
    this.confirmationModal.openVisualizationLocationsSave()
      .then(() => {
        this.saving = true;
        this.visualizationService.updateModelPositions(this.model, this.modelPositions)
          .then(() => {
            this.modelPositions.setPristine();
            this.persistentPositions = this.modelPositions.clone();
            this.saving = false;
          });
      }, modalCancelHandler);
  }

  relayoutPositions() {
    this.loading = true;
    this.modelPositions.clear();
    this.layoutAndFocus(false)
      .then(() => this.loading = false);
  }

  layoutPersistentPositions() {
    this.loading = true;
    this.modelPositions.resetWith(this.persistentPositions);
    this.layoutPositionsAndFocus(false)
      .then(() => this.loading = false);
  }

  refresh(invalidateCache: boolean = false) {
    if (this.model) {

      this.localizer = this.languageService.createLocalizer(this.model);
      this.paperHolder.setVisible(this.model);

      if (invalidateCache || this.graph.getCells().length === 0) {
        this.loading = true;
        this.operationQueue = [];
        this.visualizationService.getVisualization(this.model)
          .then(visualization => {
            // Hackish way to apply scope outside potentially currently running digest cycle
            visualization.addPositionChangeListener(() => this.$timeout(() => {}));
            this.classVisualization = visualization;
            this.persistentPositions = this.modelPositions.clone();
            this.initialize();
          });
      }
    }
  }

  queueWhenNotVisible(operation: () => void) {
    this.operationQueue.push(operation);

    if (this.visible) {
      this.executeQueue();
    }
  }

  executeQueue() {
    if (this.dimensionChangeInProgress || !this.visible) {
      setTimeout(() => this.executeQueue(), 200);
    } else {
      setTimeout(() => {
        for (let i = this.operationQueue.length - 1; i >= 0; i--) {
          this.operationQueue[i]();
        }
        this.operationQueue = [];
      });
    }
  }

  initialize() {
    this.queueWhenNotVisible(() => {
      this.graph.resetCells(this.createCells(this.classVisualization));

      const forceFitToAllContent = this.selection && this.selection.id.equals(this.model.rootClass);
      this.layoutPositionsAndFocus(forceFitToAllContent).then(() => {
        this.adjustAllLinks(VertexAction.KeepPersistent);
        this.loading = false;
      });
    });
  }

  onDelete(item: Class|Predicate) {
    this.queueWhenNotVisible(() => {
      if (item instanceof Class) {
        this.removeClass(item);
      }
    });
  }

  onEdit(newItem: Class|Predicate, oldItem: Class|Predicate|null) {
    this.queueWhenNotVisible(() => {
      // id change can cause massive association realignment in the server
      if (oldItem && newItem.id.notEquals(oldItem.id)) {
        // FIXME: api should block until writes are done and not return inconsistent data
        this.loading = true;
        this.$timeout(() => this.refresh(true), 500);
      } else if (newItem instanceof Class) {
        this.updateClassAndLayout(newItem, mapOptional(oldItem, item => item.id));
      }
    });
  }

  onAssign(item: Class|Predicate) {
    this.queueWhenNotVisible(() => {
      if (item instanceof Class) {
        this.updateClassAndLayout(item);
      }
    });
  }

  layoutPositionsAndFocus(forceFitToAllContent: boolean) {
    const withoutPositionIds = this.classVisualization.getClassIdsWithoutPosition();
    const layoutAll = withoutPositionIds.length === this.classVisualization.size;
    const ids = layoutAll ? undefined : withoutPositionIds;

    return this.layoutAndFocus(forceFitToAllContent, ids);
  }

  layoutAndFocus(forceFitToAllContent: boolean, onlyClassIds?: Uri[] /* // undefined ids means layout all */) {

    const layout = () => {
      if (onlyClassIds && onlyClassIds.length === 0) {
        return this.$q.when();
      } else {
        return layoutGraph(this.$q, this.graph, !!this.model.rootClass, onlyClassIds ? onlyClassIds : []);
      }
    };

    return layout().then(() => {
      // Delay focus because dom needs to be repainted
      window.setTimeout(() => this.focusSelection(forceFitToAllContent));
    });
  }

  private updateClassAndLayout(klass: Class, oldId?: Uri|null) {

    const creation = !oldId;
    const idChanged = oldId && klass.id.notEquals(oldId);
    const oldIdIsAssociationTarget = oldId && this.isAssociationTarget(oldId);

    if (idChanged) {
      this.modelPositions.changeClassId(oldId!, klass.id);
    }

    const addedClasses = this.addOrReplaceClass(klass);

    if (idChanged) {
      if (oldIdIsAssociationTarget) {
        addedClasses.push(oldId!);
        this.replaceClass(new AssociationTargetPlaceholderClass(oldId!, this.model));
      } else {
        this.removeClass(oldId!);
      }
    }

    if (addedClasses.length > 0) {
      this.loading = true;
      this.layoutAndFocus(false, addedClasses.filter(classId => creation || klass.id.notEquals(classId)))
        .then(() => {
          if (oldIdIsAssociationTarget) {
            this.adjustElementLinks([oldId!], VertexAction.Reset);
          }

          this.adjustElementLinks([klass.id], VertexAction.KeepPersistent);
          this.loading = false;
        });
    } else {
      // Delay focus because dom needs to be repainted
      setTimeout(() => this.focusSelection(false));
    }
  }

  adjustAllLinks(vertexAction: VertexAction) {
    this.adjustElementLinks(null, vertexAction);
  }

  adjustElementLinks(classIds: Uri[]|null, vertexAction: VertexAction) {

    const alreadyAdjusted = new Set<string>();

    if (classIds) {
      for (const classId of classIds) {
        const element = this.graph.getCell(classId.toString());
        if (element instanceof joint.dia.Element) {
          adjustElementLinks(this.paper, <joint.dia.Element> element, alreadyAdjusted, this.modelPositions, vertexAction);
        }
      }
    } else {
      for (const element of this.graph.getElements()) {
        adjustElementLinks(this.paper, element, alreadyAdjusted, this.modelPositions, vertexAction);
      }
    }
  }

  onResize() {

    this.refreshDimensions();

    if (this.visible) {
      this.executeQueue();
    }
  }

  canFocus() {
    return this.selection instanceof Class;
  }

  renderSelectionFocus() {
    switch (this.selectionFocus) {
      case FocusLevel.ALL:
        return '**';
      case FocusLevel.INFINITE_DEPTH:
        return '*';
      default:
        return (<number> this.selectionFocus).toString();
    }
  }

  focusIn() {
    if (this.selectionFocus < FocusLevel.ALL) {
      this.selectionFocus++;
    }
  }

  focusOut() {
    if (this.selectionFocus > FocusLevel.DEPTH1) {
      this.selectionFocus--;
    }
  }

  toggleShowName() {
    this.showName = (this.showName + 1) % 3;
  }

  zoomIn() {
    this.zoomInHandle = window.setInterval(() => scale(this.paper, 0.01), 10);
  }

  zoomInEnded() {
    window.clearInterval(this.zoomInHandle);
  }

  zoomOut() {
    this.zoomOutHandle = window.setInterval(() => scale(this.paper, -0.01), 10);
  }

  zoomOutEnded() {
    window.clearInterval(this.zoomOutHandle);
  }

  fitToContent(onlyVisible: boolean = false) {
    this.queueWhenNotVisible(() => {
      scaleToFit(this.paper, this.graph, onlyVisible);
    });
  }

  centerToSelectedClass() {
    const element = this.findElementForSelection();
    if (element) {
      centerToElement(this.paper, element);
    }
  }

  get showNameLabel() {
    switch (this.showName) {
      case NameType.ID:
        return 'ID';
      case NameType.LABEL:
        return 'Label';
      case NameType.LOCAL_ID:
        return 'Local ID';
      default:
        throw new Error('Unsupported show name type: ' + this.showName);
    }
  }

  onClassContextMenu(classId: string, coordinate: Coordinate): void {

    if (!this.userService.user.anonymous) {
      const klass = this.classVisualization.hasClass(classId) ? this.classVisualization.getClassById(classId)
                                                              : new AssociationTargetPlaceholderClass(new Uri(classId, this.model.context), this.model);
      this.contextMenuTarget = { coordinate, target: klass };
    }
  }

  onDismissContextMenu(): void {
    this.$scope.$apply(() => {
      this.contextMenuTarget = null;
    });
  }

  onClassClick(classId: string): void {
    this.modelPageActions.select({ id: new Uri(classId, {}), selectionType: 'class' });
  }

  onClassHover(classId: string, coordinate: Coordinate): void {

    const klass = this.classVisualization.getClassById(classId);

    if (klass) {
      this.$scope.$applyAsync(() => {
        this.popoverDetails = {
          coordinate: coordinate,
          heading: klass.label,
          comment: klass.comment
        };
      });
    }
  }

  onPropertyHover(classId: string, propertyId: string, coordinate: Coordinate): void {

    const klass = this.classVisualization.getClassById(classId);

    if (klass) {
      this.$scope.$applyAsync(() => {

        const property = requireDefined(firstMatching(klass.properties, prop => prop.internalId.toString() === propertyId));

        this.popoverDetails = {
          coordinate: coordinate,
          heading: property.label,
          comment: property.comment
        };
      });
    }
  }

  onHoverExit(): void {
    this.$scope.$applyAsync(() => {
      this.popoverDetails = null;
    });
  }

  focusSelection(forceFitToAllContent: boolean) {
    focusElement(this.paper, this.graph, this.findElementForSelection(), forceFitToAllContent, this.selectionFocus);
  }

  private findElementForSelection(): joint.dia.Element|null {

    const classOrPredicate = this.selection;

    if (classOrPredicate instanceof Class && !classOrPredicate.unsaved) {
      const cell = this.graph.getCell(classOrPredicate.id.uri);
      if (cell) {
        if (cell.isLink()) {
          throw new Error('Cell must be an element');
        } else {
          return <joint.dia.Element> cell;
        }
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  private removeClass(klass: Class|Uri) {

    const id: Uri = klass instanceof Class ? klass.id : <Uri> klass;

    this.classVisualization.removeClass(id.toString());

    // remove to be unreferenced shadow classes
    for (const element of this.graph.getNeighbors(<joint.dia.Element> this.graph.getCell(id.uri))) {
      if (element instanceof ShadowClass && this.graph.getConnectedLinks(element).length === 1) {
        element.remove();
      }
    }

    if (this.isAssociationTarget(klass)) {
      this.replaceClass(new AssociationTargetPlaceholderClass(id, this.model));
    } else {
      this.graph.getCell(id.uri).remove();
    }
  }

  private addOrReplaceClass(klass: VisualizationClass) {

    this.classVisualization.addOrReplaceClass(klass);

    if (this.isExistingClass(klass.id)) {
      return this.replaceClass(klass);
    } else {
      return this.addClass(klass, true);
    }
  }

  private replaceClass(klass: VisualizationClass) {

    const oldElement = this.graph.getCell(klass.id.uri);
    const incomingLinks: joint.dia.Link[] = [];
    const oldOutgoingClassIds = new Set<string>();

    for (const link of this.graph.getConnectedLinks(oldElement)) {

      const targetId = link.attributes.target.id;
      const targetElement = this.graph.getCell(targetId);

      if (!klass.hasAssociationTarget(new Uri(targetId, {}))) {
        if (targetElement instanceof ShadowClass && this.graph.getConnectedLinks(targetElement).length === 1) {
          // Remove to be unreferenced shadow class
          targetElement.remove();
        }
      } else {
        oldOutgoingClassIds.add(targetId);
      }

      if (link.attributes.source.id === klass.id.uri) {
        // remove outgoing links since they will be added again
        link.remove();
      } else {
        incomingLinks.push(link);
      }
    }

    oldElement.remove();

    const addedClasses = this.addClass(klass, true);
    this.graph.addCells(incomingLinks);

    return addedClasses.filter(addedClass => !klass.id.equals(addedClass) && !oldOutgoingClassIds.has(addedClass.uri));
  }

  private addClass(klass: VisualizationClass, addAssociations: boolean) {
    const classElement = this.createClassElement(this.paper, klass);

    this.graph.addCell(classElement);

    if (addAssociations) {
      return this.addAssociations(klass).concat([klass.id]);
    } else {
      return [klass.id];
    }
  }

  private addAssociation(klass: VisualizationClass, association: Property) {

    let addedClass = false;
    const classPosition = this.modelPositions.getClass(klass.id);

    if (!this.isExistingClass(association.valueClass!)) {
      // set target location as source location for layout
      classPosition.setCoordinate(this.graph.getCell(klass.id.uri).attributes.position);
      this.addClass(new AssociationTargetPlaceholderClass(association.valueClass!, this.model), false);
      addedClass = true;
    }

    this.graph.addCell(this.createAssociationLink(klass, association, classPosition.getAssociationProperty(association.internalId)));

    return addedClass;
  }

  private addAssociations(klass: VisualizationClass) {
    const addedClasses: Uri[] = [];

    for (const association of klass.associationPropertiesWithTarget) {
      const addedClass = this.addAssociation(klass, association);
      if (addedClass) {
        addedClasses.push(association.valueClass!);
      }
    }

    return addedClasses;
  }

  isExistingClass(klass: Class|Uri) {
    const id: Uri = klass instanceof Class ? klass.id : <Uri> klass;
    return !!this.graph.getCell(id.uri);
  }

  isAssociationTarget(klass: Class|Uri) {
    const id: Uri = klass instanceof Class ? klass.id : <Uri> klass;

    for (const link of this.graph.getLinks()) {
      if (link.attributes.target.id === id.uri) {
        return true;
      }
    }
    return false;
  }

  private createCells(visualization: ClassVisualization) {

    const associations: {klass: VisualizationClass, property: Property}[] = [];
    const classIds = visualization.getClassIds();

    const cells: joint.dia.Cell[] = [];

    for (const klass of visualization.getClasses()) {

      for (const property of klass.properties) {

        if (property.isAssociation() && property.valueClass) {
          if (!classIds.has(property.valueClass.uri)) {
            classIds.add(property.valueClass.uri);
            cells.push(this.createClassElement(this.paper, new AssociationTargetPlaceholderClass(property.valueClass, this.model)));
          }
          associations.push({klass, property});
        }
      }
      const element = this.createClassElement(this.paper, klass);

      cells.push(element);
    }

    for (const association of associations) {
      const associationPosition = this.modelPositions.getAssociationProperty(association.klass.id, association.property.internalId);
      const link = this.createAssociationLink(association.klass, association.property, associationPosition);
      cells.push(link);
    }

    return cells;
  }

  private get iowCellOptions() {
    return {
      showCardinality: this.model.isOfType('profile'),
      showName: this.showName,
      localizer: this.localizer
    };
  }

  private createClassElement(paper: joint.dia.Paper, klass: VisualizationClass): joint.dia.Element {

    const classCell = createClassElement(klass, () => this.iowCellOptions);
    const classPosition = this.modelPositions.getClass(klass.id);

    const onDiagramPositionChange = () => {
      const newCenter = classCell.getBBox().center();
      if (!coordinatesAreEqual(newCenter, classPosition.coordinate)) {
        const action = this.clickType === 'right' ? VertexAction.Reset : VertexAction.KeepAllButLoops;
        adjustElementLinks(paper, classCell, new Set<string>(), this.modelPositions, action);
        classPosition.setCoordinate(newCenter);
      }
    };

    const onPersistentPositionChange = (coordinate: Coordinate) => {
      const bbox = classCell.getBBox();
      const newPosition = centerToPosition(coordinate, bbox);

      if (coordinate && !coordinatesAreEqual(newPosition, bbox)) {
        classCell.position(newPosition.x, newPosition.y);
        adjustElementLinks(paper, classCell, new Set<string>(), this.modelPositions, VertexAction.KeepAll);
      }
    };

    // Initial position
    const position = this.modelPositions.getClass(klass.id);

    if (position.isDefined()) {
      onPersistentPositionChange(position.coordinate!);
    }

    classCell.on('change:position', onDiagramPositionChange);
    classPosition.changeListeners.push(onPersistentPositionChange);

    this.$scope.$watch(() => this.localizer.language, ifChanged(() => this.queueWhenNotVisible(classCell.updateModel)));
    this.$scope.$watch(() => this.showName, ifChanged(() => this.queueWhenNotVisible(classCell.updateModel)));

    return classCell;
  }

  private createAssociationLink(klass: VisualizationClass, association: Property, position: AssociationPropertyPosition): joint.dia.Link {

    const associationCell = createAssociationLink(klass, association, () => this.iowCellOptions);

    const onDiagramVerticesChange = () => {
      const propertyPosition = this.modelPositions.getAssociationProperty(klass.id, association.internalId);
      const vertices = normalizeAsArray(associationCell.get('vertices'));
      const oldVertices = propertyPosition.vertices;

      if (!arraysAreEqual(vertices, oldVertices, coordinatesAreEqual)) {
        propertyPosition.setVertices(copyVertices(normalizeAsArray(associationCell.get('vertices'))));
        associationCell.prop('labels/0/position', calculateLabelPosition(this.paper, this.graph, associationCell));
      }
    };

    const onPersistentVerticesChange = (vertices: Coordinate[]) => {
      const oldVertices = normalizeAsArray(associationCell.get('vertices'));

      if (!arraysAreEqual(vertices, oldVertices, coordinatesAreEqual)) {
        associationCell.set('vertices', copyVertices(vertices));
      }
    };

    // Initial vertices
    onPersistentVerticesChange(position.vertices);

    associationCell.on('change:vertices', onDiagramVerticesChange);
    position.changeListeners.push(onPersistentVerticesChange);

    this.$scope.$watch(() => this.localizer.language, ifChanged(() => this.queueWhenNotVisible(associationCell.updateModel)));
    this.$scope.$watch(() => this.showName, ifChanged(() => this.queueWhenNotVisible(associationCell.updateModel)));

    return associationCell;
  }
}

interface Download {
  name: string;
  filename: string;
  href: string;
  onClick: () => void;
}
