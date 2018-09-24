import { createNotification, InteractiveHelp, Notification, Story, StoryLine } from './contract';
import { KnownModelType } from 'app/types/entity';
import * as FrontPage from './pages/frontPageHelp.po';
import * as NewModelPage from './pages/model/newModelPageHelp.po';
import * as ModelPage from './pages/model/modelPageHelp.po';
import * as ModelView from './pages/model/modelViewHelp.po';
import * as ClassView from './pages/model/classViewHelp.po';
import * as ClassForm from './pages/model/classFormHelp.po';
import * as VisualizationView from './pages/model/visualizationViewHelp.po';
import { helpLibrary, helpProfile } from './data';
import { HelpBuilderService } from './services/helpBuilder';
import { EntityLoader } from 'app/services/entityLoader';
import { Language } from 'app/types/language';

function createNewLibraryItems(lang: Language): Story[] {

  return [
    ...FrontPage.startModelCreation('library'),
    ...NewModelPage.createModelItems(helpLibrary, lang),
    ModelPage.openModelDetails('library'),
    ModelView.modifyModel('library'),
    ...ModelView.addVocabularyItems(helpLibrary.vocabulary, lang),
    ...ModelView.addNamespaceItems(helpLibrary.importedLibrary),
    ModelView.saveModelChanges,
    ...ModelPage.assignClassItems(helpLibrary.person, lang),
    ...ModelPage.assignClassItems(helpLibrary.contact, lang),
    ...ModelPage.assignClassItems(helpLibrary.address, lang),
    ...ModelPage.createNewClassItems(helpLibrary.newClass, lang),
    ...ClassForm.addSuperClassItems(ClassView.element, helpLibrary.newClass.superClass, lang),
    ...ClassView.addPropertyUsingExistingPredicateItems(helpLibrary.newClass.property.name, lang),
    ...ClassView.addPropertyBasedOnSuggestionItems(helpLibrary.newClass.property.passengers, lang),
    ...ClassView.addPropertyBasedOnExistingConceptItems(helpLibrary.newClass.property.owner, lang),
    ...ClassForm.addAssociationTargetItems(ClassView.element, helpLibrary.newClass.property.owner.target, lang),
    ClassView.saveClassChanges,
    VisualizationView.focusVisualization
  ];
}

function createNewProfileItems(lang: Language): Story[] {

  return [
    ...FrontPage.startModelCreation('profile'),
    ...NewModelPage.createModelItems(helpProfile, lang),
    ModelPage.openModelDetails('profile'),
    ModelView.modifyModel('profile'),
    ...ModelView.addVocabularyItems(helpProfile.vocabulary, lang),
    ...ModelView.addNamespaceItems(helpProfile.importedLibrary),
    ModelView.saveModelChanges,
    ...ModelPage.specializeClassItems(helpProfile.specializedClass, lang),
    ...ModelPage.createNewClassItems(helpProfile.newClass, lang),
    ...ClassView.addPropertyUsingExistingPredicateItems(helpProfile.newClass.property.name, lang),
    ...ClassView.addPropertyBasedOnSuggestionItems(helpProfile.newClass.property.produced, lang),
    ...ClassForm.addAssociationTargetItems(ClassView.element, helpProfile.newClass.property.produced.target, lang),
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
