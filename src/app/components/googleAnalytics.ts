import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const GoogleAnalyticsComponent: ComponentDeclaration = {
  selector: 'googleAnalytics',
  template: require('./googleAnalytics.html'),
  controller: forwardRef(() => GoogleAnalyticsController)
};

export class GoogleAnalyticsController {
}
