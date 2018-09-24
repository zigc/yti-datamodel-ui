import { IPromise } from 'angular';
import { InteractiveHelpService } from './services/interactiveHelpService';

export type PopoverPosition = 'top-left'
                            | 'top-right'
                            | 'right-up'
                            | 'right-down'
                            | 'left-up'
                            | 'left-down'
                            | 'bottom-left'
                            | 'bottom-right';

export interface Explicit         { type: 'explicit'; }                                                     // explicit next button to continue
export interface Click            { type: 'click', element: () => JQuery; ambiguous?: boolean; }            // click on element to continue
export interface NavigatingClick  { type: 'navigating-click'; element: () => JQuery; ambiguous?: boolean; } // click on element which is expected to change location
export interface ModifyingClick   { type: 'modifying-click'; element: () => JQuery; ambiguous?: boolean; }  // click on element which is expected to disappear to continue
export interface ExpectedState    { type: 'expected-state'; valid: () => boolean; }                         // free control for validation

export type NextCondition = Explicit
                          | Click
                          | NavigatingClick
                          | ModifyingClick
                          | ExpectedState;

export interface ScrollWithDefault { type: 'scroll-with-default'; element: () => JQuery; offsetFromTop?: number; }
export interface ScrollWithElement { type: 'scroll-with-element'; scrollElement: () => JQuery; element: () => JQuery; offsetFromTop?: number; }
export interface ScrollNone        { type: 'scroll-none' }


export type Scroll = ScrollWithDefault
                   | ScrollWithElement
                   | ScrollNone;

export interface HelpEventHandler {
  onInit?: (service: InteractiveHelpService) => IPromise<boolean>; // result boolean indicates if initialization will change location
  onComplete?: () => void;
  onCancel?: () => void;
}

export interface InteractiveHelp extends HelpEventHandler {
  storyLine: StoryLine;
}

export interface StoryLine {
  title: string;
  description: string;
  items: () => (Story|Notification)[];
}

export interface Notification extends NotificationDetails {
  type: 'notification';
}

export interface NotificationDetails {
  title: { key: string, context?: any };
  content?: { key: string, context?: any };
}

export interface Story extends StoryDetails {
  type: 'story';
}

export interface StoryDetails {
  title: { key: string, context?: any };
  content?: { key: string, context?: any };
  scroll?: Scroll; // when not defined it will be implicitly ScrollWithDefault to popover element with 100px offset
  popover: {
    element: () => JQuery,
    position: PopoverPosition
  };
  focus?: {
    element: () => JQuery,
    margin?: { top?: number, right?: number, bottom?: number, left?: number }
  };
  nextCondition: NextCondition;
  initialize?: () => boolean; // return true on success, false will try to retry
  reversible?: boolean;
  denyInteraction?: boolean;
}

export function createStory(storyDetails: StoryDetails) {
  return Object.assign({}, storyDetails, {
    type: 'story' as 'story'
  });
}

export function createNotification(notificationDetails: NotificationDetails): Notification {
  return Object.assign({}, notificationDetails, {
    type: 'notification' as 'notification'
  });
}

export function createExplicitNextCondition(): Explicit {
  return { type: 'explicit' };
}

export function createClickNextCondition(element: () => JQuery, ambiguous?: boolean): Click {
  return { type: 'click', element, ambiguous };
}

export function createNavigatingClickNextCondition(element: () => JQuery, ambiguous?: boolean): NavigatingClick {
  return { type: 'navigating-click', element, ambiguous };
}

export function createModifyingClickNextCondition(element: () => JQuery, ambiguous?: boolean): ModifyingClick {
  return { type: 'modifying-click', element, ambiguous };
}

export function createExpectedStateNextCondition(valid: () => boolean): ExpectedState {
  return { type: 'expected-state', valid };
}

export function createScrollWithDefault(element: () => JQuery, offsetFromTop?: number): ScrollWithDefault {
  return { type: 'scroll-with-default', element, offsetFromTop };
}

export function createScrollWithElement(scrollElement: () => JQuery, element: () => JQuery, offsetFromTop?: number): ScrollWithElement {
  return { type: 'scroll-with-element', scrollElement, element, offsetFromTop };
}

export function createScrollNone(): ScrollNone {
  return { type: 'scroll-none' };
}

export const scrollToTop = createScrollWithDefault(() => jQuery('body'));
