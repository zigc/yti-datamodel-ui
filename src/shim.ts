import 'core-js';
import './svgShim';
import 'proxy-polyfill';
import 'css.escape';
import './vendor/canvas-ToBlob';
import 'zone.js';

import * as jQuery from 'jquery';
window.jQuery = jQuery;

window.requestAnimFrame =
  window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || ((callback: FrameRequestCallback) => window.setTimeout(callback, 1000 / 60));
