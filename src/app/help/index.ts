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
import { comparingPrimitive } from 'yti-common-ui/utils/comparator';
import { availableUILanguages } from 'app/types/language';
import { flatten } from 'yti-common-ui/utils/array';

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
    logTranslation(flatten(availableUILanguages.map(lang => [
      ...frontPageHelpService.getHelps(lang),
      ...modelPageHelpService.getHelps('library', 'bogusPrefix', lang),
      ...modelPageHelpService.getHelps('profile', 'bogusPrefix', lang)
    ])));
  }
});

function logTranslation(helps: InteractiveHelp[]) {

  const translations: { key: string, context?: any }[] = [];

  for (const help of helps) {
    const storyLine = help.storyLine;

    translations.push({ key: storyLine.title });
    translations.push({ key: storyLine.description });

    for (const item of storyLine.items()) {
      translations.push(item.title);

      if (item.content) {
        translations.push(item.content);
      }
    }
  }

  translations.sort(comparingPrimitive(translation => translation.key));

  let result = '';
  let previousKey = '';

  for (const {key, context} of translations) {

    const contextKeys = Object.keys(context || {}).map(k => `{{${k}}}`).join(' ');

    if (key !== previousKey) {
      result += `<div translate>${key}</div> ${contextKeys}\n`;
    }

    previousKey = key;
  }

  console.log(result);
}
