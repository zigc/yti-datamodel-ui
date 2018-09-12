import { IScope, IWindowService } from 'angular';
import { SessionService } from 'app/services/sessionService';
import { forwardRef, NgZone } from '@angular/core';
 import { ComponentDeclaration } from 'app/utils/angular';

export const DividerComponent: ComponentDeclaration = {
  selector: 'divider',
  bindings: {
    selectionWidth: '='
  },
  template: `<div class="divider" ng-mousedown="$ctrl.moveDivider($event)"></div>`,
  controller: forwardRef(() => DividerController)
};

const modelPanelLeft = 350;
const minSelectionWidth = 520;
const normalSelectionWidth = 720;
const minVisualizationWidth = 321;

class DividerController {

  selectionWidth: number;

  constructor(private $scope: IScope,
              private $window: IWindowService,
              private zone: NgZone,
              private sessionService: SessionService) {
    'ngInject';
  }

  $onInit() {

    this.initWidth();

    const onResize = () => {
      this.initWidth();
      this.$scope.$apply();
    };

    this.zone.runOutsideAngular(() => {
      this.$window.addEventListener('resize', onResize);
    });

    this.$scope.$on('$destroy', () => this.$window.removeEventListener('resize', onResize));
  }

  initWidth() {
    this.selectionWidth = Math.min(this.maxWidth - minVisualizationWidth, this.sessionService.selectionWidth || normalSelectionWidth);
  }

  get maxWidth() {
    return this.$window.innerWidth - modelPanelLeft;
  }

  moveDivider(mouseDown: MouseEvent) {

    mouseDown.preventDefault();

    const offset = mouseDown.clientX - this.selectionWidth;
    const maxWidth = this.maxWidth;

    const onMouseMove = (event: MouseEvent) => {
      const newWidth = event.clientX - offset;

      if ((newWidth >= minSelectionWidth && newWidth < this.selectionWidth)
        || (newWidth <= (maxWidth - minVisualizationWidth) && newWidth > this.selectionWidth)) {
        this.sessionService.selectionWidth = newWidth;
        this.selectionWidth = newWidth;
        this.$scope.$apply();
      }
    };

    const onMouseUp = () => {
      this.$window.removeEventListener('mousemove', onMouseMove);
      this.$window.removeEventListener('mouseup', onMouseUp);
    };

    this.zone.runOutsideAngular(() => {
      this.$window.addEventListener('mousemove', onMouseMove);
      this.$window.addEventListener('mouseup', onMouseUp);
    });
  }
}
