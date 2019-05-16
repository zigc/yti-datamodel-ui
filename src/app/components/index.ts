import { FrontPageComponent } from './frontPage';
import { AdvancedSearchModal } from './advancedSearchModal';
import { MaintenanceModal } from './maintenance';
import { ApplicationComponent } from './application';

import { componentDeclaration } from 'app/utils/angular';
import { module as mod } from './module';
export { module } from './module';

mod.component('frontPage', componentDeclaration(FrontPageComponent));
mod.component('application', componentDeclaration(ApplicationComponent));

mod.service('advancedSearchModal', AdvancedSearchModal);
mod.service('maintenanceModal', MaintenanceModal);
