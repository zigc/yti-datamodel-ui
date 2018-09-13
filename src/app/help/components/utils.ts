import { areEqual, assertNever, Optional } from 'yti-common-ui/utils/object';
import { Click, ModifyingClick, NavigatingClick, NextCondition, Notification, Story } from 'app/help/contract';
import { contains } from 'yti-common-ui/utils/array';

export const popupAnimationTimeInMs = 300; // should match css help-popover transition time
export const arrowHeight = 13;

export interface Dimensions {
  width: number;
  height: number
}

export interface PopoverDimensionsProvider {
  getDimensions(): Dimensions;
}

export interface Positioning {
  left: number;
  top: number;
  width?: number;
  height?: number;
  right?: number;
  bottom?: number;
}

export interface Regions {
  top: Positioning;
  right: Positioning;
  bottom: Positioning;
  left: Positioning;
  focus: Positioning;
}

export function resolveArrowClass(item: Optional<Story|Notification>) {

  if (!item) {
    return [];
  }

  switch (item.type) {
    case 'story':
      return ['help-arrow', `help-${item.popover.position}`];
    case 'notification':
      return [];
    default:
      return assertNever(item, 'Unknown item type');
  }
}

export function elementPositioning(element: JQuery) {

  if (!element || element.length === 0) {
    return null;
  }

  const rect = element[0].getBoundingClientRect();

  const left = rect.left + window.pageXOffset;
  const top = rect.top + window.pageYOffset;
  const width = rect.width;
  const height = rect.height;

  return {
    left,
    right: left + width,
    top,
    bottom: top + height,
    width,
    height
  };
}

export function isVisible(element: HTMLElement) {
  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

export function elementExists(e: JQuery) {
  return e && e.length > 0 && isVisible(e[0]);
}

export function isClick(nextCondition: NextCondition): nextCondition is Click|ModifyingClick|NavigatingClick {
  return contains(['click', 'navigating-click', 'modifying-click'], nextCondition.type);
}

export function isFocusInElement(event: JQueryEventObject, element: HTMLElement) {
  return (event.target || event.srcElement) === element;
}

export function stopEvent(event: JQueryEventObject) {
  event.preventDefault();
  event.stopPropagation();
}

export function isNumberInMargin(margin: number, lhs?: number, rhs?: number) {
  return areEqual(lhs, rhs, (l, r) => r >= (l - margin) && r <= (l + margin));
}

export function isPositionInMargin(margin: number, lhs: Optional<Positioning>, rhs: Optional<Positioning>) {
  return areEqual(lhs, rhs, (l, r) =>
    isNumberInMargin(margin, l.width, r.width) &&
    isNumberInMargin(margin, l.height, r.height) &&
    isNumberInMargin(margin, l.left, r.left) &&
    isNumberInMargin(margin, l.top, r.top)
  );
}

export function isInWindow(positioning: Positioning) {

  const windowTop = window.pageYOffset;
  const windowBottom = windowTop + window.innerHeight;
  const positionTop = positioning.top;
  const positionBottom = positionTop + (positioning.height || 500);

  return positionTop >= windowTop && positionTop <= windowBottom
    || positionBottom >= windowTop && positionBottom <= windowBottom;
}
