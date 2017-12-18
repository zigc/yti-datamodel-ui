import { module as mod } from './module';
export { module } from './module';
import { registerComponent } from '../utils/angular';
import { component as frontPage } from './frontPage';
import { AdvancedSearchModal } from './advancedSearchModal';
import { MaintenanceModal } from './maintenance';

registerComponent(mod, frontPage);

import './application';
import './googleAnalytics';
import './maintenance';

mod.service('advancedSearchModal', AdvancedSearchModal);
mod.service('maintenanceModal', MaintenanceModal);
