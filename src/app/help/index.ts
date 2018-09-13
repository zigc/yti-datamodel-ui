import { module as mod } from './module';
export { module } from './module';
import { registerComponent } from 'app/utils/angular';

import { InteractiveHelpService } from './services/interactiveHelpService';
import { InteractiveHelpModelService } from './services/helpModelService';
import { InteractiveHelpClassService } from './services/helpClassService';
import { InteractiveHelpPredicateService } from './services/helpPredicateService';
import { InteractiveHelpUserService } from './services/helpUserService';
import { InteractiveHelpVocabularyService } from './services/helpVocabularyService';
import { InteractiveHelpVisualizationService } from './services/helpVisualizationService';
import { InteractiveHelpValidatorService } from './services/helpValidatorService';

import { FrontPageHelpService } from './frontPageHelp';
import { ModelPageHelpService } from './modelPageHelp';

import { InteractiveHelpDisplay } from './components/interactiveHelpDisplay';
import { InteractiveHelpOrganizationService } from './services/helpOrganizationService';
import { InteractiveHelpPopoverComponent } from './components/interactiveHelpPopover';
import { InteractiveHelpPopoverDimensionsCalculatorComponent } from './components/interactiveHelpPopoverDimensionsCalculator';
import { InteractiveHelpBackdropComponent } from './components/interactiveHelpBackdrop';

registerComponent(mod, InteractiveHelpPopoverComponent);
registerComponent(mod, InteractiveHelpPopoverDimensionsCalculatorComponent);
registerComponent(mod, InteractiveHelpBackdropComponent);

mod.service('interactiveHelpService', InteractiveHelpService);
mod.service('helpModelService', InteractiveHelpModelService);
mod.service('helpClassService', InteractiveHelpClassService);
mod.service('helpPredicateService', InteractiveHelpPredicateService);
mod.service('helpUserService', InteractiveHelpUserService);
mod.service('helpVocabularyService', InteractiveHelpVocabularyService);
mod.service('helpVisualizationService', InteractiveHelpVisualizationService);
mod.service('helpValidatorService', InteractiveHelpValidatorService);
mod.service('helpOrganizationService', InteractiveHelpOrganizationService);

mod.service('frontPageHelpService', FrontPageHelpService);
mod.service('modelPageHelpService', ModelPageHelpService);

mod.service('interactiveHelpDisplay', InteractiveHelpDisplay);
