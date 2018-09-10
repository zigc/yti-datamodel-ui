/// <reference types="angular-route" />
/// <reference types="angular-animate" />

import * as __angular from 'angular';

declare global {
  const angular: typeof __angular;
}

declare global {

  interface Window {
    jQuery: JQueryStatic;
    encodeURIComponent: any;
    requestAnimFrame(callback: FrameRequestCallback): number;
    webkitRequestAnimationFrame(callback: FrameRequestCallback): number;
    mozRequestAnimationFrame(callback: FrameRequestCallback): number;
  }

  interface Error {
    stack?: string;
  }

  interface MousewheelEvent extends JQueryEventObject {
    deltaFactor: number;
    deltaX: number;
    deltaY: number;
  }

  interface JQuery {
    mousewheel(handler: (eventObject: MousewheelEvent) => any): JQuery;
    controller(name: string): any;
  }

  interface CSS {
    escape(str: string): string;
  }
}

declare module 'angular' {
  interface INgModelController {
    $options: any;
  }
}
