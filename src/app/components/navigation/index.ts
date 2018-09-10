import { BreadcrumbComponent } from './breadcrumb';
import { NavigationBarComponent } from './navigationBar';

import { registerComponent } from 'app/utils/angular';
import { module as mod } from './module';
export { module } from './module';

registerComponent(mod, BreadcrumbComponent);
registerComponent(mod, NavigationBarComponent);
