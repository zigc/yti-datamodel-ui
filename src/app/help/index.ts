import { module as mod } from './module';
import { componentDeclaration } from 'app/utils/angular';

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

export { module } from './module';

mod.component('helpPopover', componentDeclaration(InteractiveHelpPopoverComponent));
mod.component('helpPopoverDimensionsCalculator', componentDeclaration(InteractiveHelpPopoverDimensionsCalculatorComponent));
mod.component('helpBackdrop', componentDeclaration(InteractiveHelpBackdropComponent));

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
