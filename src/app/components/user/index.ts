import { UserPageComponent } from './userPage';

import { componentDeclaration } from 'app/utils/angular';
import { module as mod } from './module';
export { module } from './module';

mod.component('userPage', componentDeclaration(UserPageComponent));
