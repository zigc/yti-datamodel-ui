import { FrontPageComponent } from './frontPage';
import { AdvancedSearchModal } from './advancedSearchModal';
import { MaintenanceModal } from './maintenance';
import { ApplicationComponent } from './application';
import { GoogleAnalyticsComponent } from './googleAnalytics';

import { registerComponent } from 'app/utils/angular';
import { module as mod } from './module';
export { module } from './module';

registerComponent(mod, FrontPageComponent);
registerComponent(mod, ApplicationComponent);
registerComponent(mod, GoogleAnalyticsComponent);

mod.service('advancedSearchModal', AdvancedSearchModal);
mod.service('maintenanceModal', MaintenanceModal);
