import { registerComponent } from 'app/utils/angular';
import { ClassVisualizationComponent } from './classVisualization';
import { VisualizationPopoverComponent } from './popover';
import { VisualizationContextMenuComponent } from './contextMenu';

import { module as mod } from './module';
export { module } from './module';

registerComponent(mod, ClassVisualizationComponent);
registerComponent(mod, VisualizationPopoverComponent);
registerComponent(mod, VisualizationContextMenuComponent);
