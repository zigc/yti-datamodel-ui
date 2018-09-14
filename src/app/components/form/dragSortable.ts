import { IAttributes, IDirectiveFactory, IRepeatScope, IScope } from 'angular';
import { moveElement, resetWith } from 'yti-common-ui/utils/array';
import { LegacyDirective } from 'app/utils/angular';

interface DragSortableAttributes extends IAttributes {
  dragSortable: string;
  dragDisabled: string;
  onReorder: string;
}

@LegacyDirective({
})
export class DragSortableDirective<T> {

  drag: Drag|null = null;
  dragDisabled: boolean;
  dragValuesOriginal: T[]|null = null;
  dragValues: T[];
  onReorder: (item: T, index: number) => void;

  constructor(private $scope: IScope,
              private $attrs: DragSortableAttributes) {
    'ngInject';
  }

  $postLink() {
    this.$scope.$watch(this.$attrs.dragSortable, (values: any[]) => this.dragValues = values);
    this.$scope.$watch(this.$attrs.dragDisabled, (disabled: boolean) => this.dragDisabled = disabled);
    this.$scope.$watch(this.$attrs.onReorder, (onReorder: (item: any, index: number) => void) => this.onReorder = onReorder);
  }

  startDrag(dataTransfer: DataTransfer, fromIndex: number, sourceWidth: number): void {
    dataTransfer.setData('text', '');
    dataTransfer.dropEffect = 'move';
    dataTransfer.effectAllowed = 'move';

    this.drag = { fromIndex, droppable: true, cloneCreated: false, sourceWidth };
    this.dragValuesOriginal = this.dragValues.slice();
  }

  cloneCreated() {

    if (!this.drag) {
      throw new Error('Drag not started');
    }

    this.drag.cloneCreated = true;
  }

  overDroppable(index: number, targetWidth: number, mousePosition: number) {

    if (!this.drag) {
      throw new Error('Drag not started');
    }

    const sourceWidth = this.drag.sourceWidth;
    const toLeft = index < this.drag.fromIndex;
    const stableDropRegion = toLeft ? mousePosition < sourceWidth : mousePosition > targetWidth - sourceWidth;

    if (stableDropRegion) {
      this.drag.droppable = true;
      if (this.canDrop(index)) {

        moveElement(this.dragValues, this.drag.fromIndex, index, this.onReorder);
        this.drag.fromIndex = index;
      }
    }
  }

  notOverDroppable() {

    if (!this.drag) {
      throw new Error('Drag not started');
    }

    this.drag.droppable = false;
  }

  canDrop(index: number) {

    if (!this.drag) {
      throw new Error('Drag not started');
    }

    return this.drag.fromIndex !== index;
  }

  drop() {
    if (this.drag && !this.drag.droppable) {
      resetWith(this.dragValues, this.dragValuesOriginal || []);
    }
    this.drag = null;
    this.dragValuesOriginal = null;
  }
}

interface Drag {
  fromIndex: number;
  droppable: boolean;
  cloneCreated: boolean;
  sourceWidth: number;
}

export const DragSortableItemDirective: IDirectiveFactory = () => {
  return {
    require: '^dragSortable',
    link($scope: IRepeatScope, element: JQuery, _attributes: IAttributes, dragSortable: DragSortableDirective<any>) {

      const selectStartHandler = () => element[0].dragDrop(); // IE9 support hack

      const dragStartHandler = (event: JQueryMouseEventObject) => $scope.$apply(
        () => dragSortable.startDrag((<DragEvent> event.originalEvent).dataTransfer, $scope.$index, element.width()));

      const dragEndHandler = () => $scope.$apply(() => dragSortable.drop());

      const dragOverHandler = (event: JQueryMouseEventObject) => {
        if (dragSortable.drag) {
          event.preventDefault();

          const originalEvent = (<DragEvent> event.originalEvent);
          const mousePosition = originalEvent.clientX - element.offset().left;

          $scope.$apply(() => dragSortable.overDroppable($scope.$index, element.width(), mousePosition));
        }
      };

      const dragLeaveHandler = () => $scope.$apply(() => dragSortable.notOverDroppable());

      const dragEnterHandler = () => $scope.$apply(() => dragSortable.cloneCreated());

      const dropHandler = (event: JQueryMouseEventObject) => {
        event.preventDefault();
        $scope.$apply(() => dragSortable.drop());
      };

      $scope.$watch(() => dragSortable.drag, drag => {
        const dragReady = drag ? drag.cloneCreated : false;
        element.toggleClass('dragged', dragReady && drag!.fromIndex === $scope.$index);
        element.toggleClass('droppable', dragReady && drag!.droppable);
      }, true);

      function init() {
        element.attr('draggable', 'true');
        element.on('selectstart', selectStartHandler);
        element.on('dragstart', dragStartHandler);
        element.on('dragend', dragEndHandler);
        element.on('dragover', dragOverHandler);
        element.on('dragleave', dragLeaveHandler);
        element.on('dragenter', dragEnterHandler);
        element.on('drop', dropHandler);
      }

      function release() {
        element.attr('draggable', 'false');
        element.off('selectstart', selectStartHandler);
        element.off('dragstart', dragStartHandler);
        element.off('dragend', dragEndHandler);
        element.off('dragover', dragOverHandler);
        element.off('dragleave', dragLeaveHandler);
        element.off('dragenter', dragEnterHandler);
        element.off('drop', dropHandler);
      }

      $scope.$watch(() => dragSortable.dragDisabled, disabled => {
        if (disabled) {
          release();
        } else {
          init();
        }
      });

      $scope.$on('$destroy', release);
    }
  };
};
