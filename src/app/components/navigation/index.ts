import { BreadcrumbComponent } from './breadcrumb';
import { NavigationBarComponent } from './navigationBar';

import { componentDeclaration } from 'app/utils/angular';
import { module as mod } from './module';
export { module } from './module';

mod.component('breadcrumb', componentDeclaration(BreadcrumbComponent));
mod.component('navigationBar', componentDeclaration(NavigationBarComponent));
