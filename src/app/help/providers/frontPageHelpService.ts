import { createNotification, InteractiveHelp, Notification, Story, StoryLine } from 'app/help/contract';
import { KnownModelType } from 'app/types/entity';
import * as FrontPage from 'app/help/pages/frontPage.po';
import * as NewModelPage from 'app/help/pages/model/newModelPage.po';
import * as ModelPage from 'app/help/pages/model/modelPage.po';
import * as ModelView from 'app/help/pages/model/modelView.po';
import * as ClassView from 'app/help/pages/model/classView.po';
import * as VisualizationView from 'app/help/pages/model/visualizationView.po';
import { helpLibrary, helpProfile } from 'app/help/providers/data';
import { HelpBuilderService } from 'app/help/providers/helpBuilderService';
import { EntityLoader } from 'app/services/entityLoader';
import { Language } from 'app/types/language';

function createNewLibraryItems(lang: Language): Story[] {

  return [
    ...FrontPage.UseCases.startModelCreation('library'),
    ...NewModelPage.UseCases.createModel(helpLibrary, lang),
    ModelPage.openModelDetails('library'),
    ModelView.modifyModel('library'),
    ...ModelView.UseCases.addVocabulary(helpLibrary.vocabulary, lang),
    ...ModelView.UseCases.addModelNamespace(helpLibrary.importedLibrary),
    ModelView.saveModelChanges,
    ...ModelPage.UseCases.assignClass(helpLibrary.person, lang),
    ...ModelPage.UseCases.assignClass(helpLibrary.contact, lang),
    ...ModelPage.UseCases.assignClass(helpLibrary.address, lang),
    ...ModelPage.UseCases.createNewClass(helpLibrary.newClass, lang),
    ...ClassView.UseCases.addSuperClass(helpLibrary.newClass.superClass, lang),
    ...ClassView.UseCases.addPropertyUsingExistingPredicate(helpLibrary.newClass.property.name, lang),
    ...ClassView.UseCases.addPropertyBasedOnSuggestion(helpLibrary.newClass.property.passengers, lang),
    ...ClassView.UseCases.addPropertyBasedOnExistingConcept(helpLibrary.newClass.property.owner, lang),
    ...ClassView.UseCases.addAssociationTarget(helpLibrary.newClass.property.owner.target, lang),
    ClassView.saveClassChanges,
    VisualizationView.focusVisualization
  ];
}

function createNewProfileItems(lang: Language): Story[] {

  return [
    ...FrontPage.UseCases.startModelCreation('profile'),
    ...NewModelPage.UseCases.createModel(helpProfile, lang),
    ModelPage.openModelDetails('profile'),
    ModelView.modifyModel('profile'),
    ...ModelView.UseCases.addVocabulary(helpProfile.vocabulary, lang),
    ...ModelView.UseCases.addModelNamespace(helpProfile.importedLibrary),
    ModelView.saveModelChanges,
    ...ModelPage.UseCases.specializeClass(helpProfile.specializedClass, lang),
    ...ModelPage.UseCases.createNewClass(helpProfile.newClass, lang),
    ...ClassView.UseCases.addPropertyUsingExistingPredicate(helpProfile.newClass.property.name, lang),
    ...ClassView.UseCases.addPropertyBasedOnSuggestion(helpProfile.newClass.property.produced, lang),
    ...ClassView.UseCases.addAssociationTarget(helpProfile.newClass.property.produced.target, lang),
    ClassView.saveClassChanges,
    VisualizationView.focusVisualization
  ];
}

export function finishedCreateNewModelNotification(type: KnownModelType): Notification {
  return createNotification({
    title: { key: `Congratulations for completing ${type} creation!` },
    content: { key: `Congratulations for completing ${type} creation! description` }
  });
}

function createNewModel(type: KnownModelType, lang: Language): StoryLine {
  return {
    title: `Guide through creating new ${type}`,
    description: `Guide through creating new ${type} description`,
    items: () => [
      ...(type === 'profile' ? createNewProfileItems(lang) : createNewLibraryItems(lang)),
      finishedCreateNewModelNotification(type)
    ]
  };
}

export class FrontPageHelpService {

  constructor(private helpBuilderService: HelpBuilderService) {
    'ngInject';
  }

  getHelps(lang: Language): InteractiveHelp[] {

    const initializer = (loader: EntityLoader) => {
    };

    const builder = this.helpBuilderService.create({
      onEnd: '/'
    });

    builder.add(createNewModel('library', lang), initializer);
    builder.add(createNewModel('profile', lang), initializer);

    return builder.helps;
  }
}
