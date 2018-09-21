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
import { HelpBuilderService } from './services/helpBuilder';
import { InteractiveHelp } from './contract';

export { module } from './module';

const logTranslations = false;

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
mod.service('helpBuilderService', HelpBuilderService);

mod.run((
  frontPageHelpService: FrontPageHelpService,
  modelPageHelpService: ModelPageHelpService
) => {
  'ngInject';

  if (logTranslations) {
    logTranslation([
      ...frontPageHelpService.getHelps(),
      ...modelPageHelpService.getHelps('library', 'bogusPrefix'),
      ...modelPageHelpService.getHelps('profile', 'bogusPrefix')
    ]);
  }
});

function logTranslation(helps: InteractiveHelp[]) {

  const keys: string[] = [];

  for (const help of helps) {
    const storyLine = help.storyLine;

    keys.push(storyLine.title);
    keys.push(storyLine.description);

    for (const item of storyLine.items()) {
      keys.push(item.title.key);

      if (item.content) {
        keys.push(item.content.key);
      }
    }
  }

  keys.sort();

  let result = '';
  let previous = '';

  for (const key of keys) {
    if (key !== previous) {
      result += `<div translate>${key}</div>\n`;
    }

    previous = key;
  }

  console.log(result);
}
