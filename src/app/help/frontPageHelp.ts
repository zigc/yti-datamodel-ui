import { ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import { createHelpWithDefaultHandler, createNotification, InteractiveHelp, Story, StoryLine, Notification } from './contract';
import { KnownModelType } from 'app/types/entity';
import gettextCatalog = angular.gettext.gettextCatalog;
import * as FrontPage from './pages/frontPageHelp.po';
import * as NewModelPage from './pages/model/newModelPageHelp.po';
import * as ModelPage from './pages/model/modelPageHelp.po';
import * as ModelView from './pages/model/modelViewHelp.po';
import * as ClassView from './pages/model/classViewHelp.po';
import * as ClassForm from './pages/model/classFormHelp.po';
import * as SearchClassificationModal from './pages/model/modal/searchClassificationModalHelp.po';
import * as SearchOrganizationsModal from './pages/model/modal/searchOrganizationModalHelp.po';
import * as VisualizationView from './pages/model/visualizationViewHelp.po';
import { exampleLibrary, exampleProfile } from './entities';

function createNewLibraryItems(gettextCatalog: gettextCatalog): Story[] {

  return [
    ...FrontPage.startModelCreation('library'),
    NewModelPage.enterModelLabel('library', exampleLibrary.name, gettextCatalog),
    NewModelPage.enterModelComment(exampleLibrary.comment, gettextCatalog),
    NewModelPage.enterModelLanguage,
    NewModelPage.enterModelPrefix(exampleLibrary.prefix),
    NewModelPage.addClassification,
    SearchClassificationModal.selectClassification(exampleLibrary.classification.name, exampleLibrary.classification.id),
    NewModelPage.focusClassifications,
    NewModelPage.addContributor,
    SearchOrganizationsModal.selectOrganization(exampleLibrary.organization.name, exampleLibrary.organization.id),
    NewModelPage.focusContributors,
    NewModelPage.saveUnsavedModel,
    ModelPage.openModelDetails('library'),
    ModelView.modifyModel('library'),
    ...ModelView.addVocabularyItems(exampleLibrary.vocabulary, gettextCatalog),
    ...ModelView.addNamespaceItems(exampleLibrary.importedLibrary, gettextCatalog),
    ModelView.saveModelChanges,
    ...ModelPage.assignClassItems(exampleLibrary.person, gettextCatalog),
    ...ModelPage.assignClassItems(exampleLibrary.contact, gettextCatalog),
    ...ModelPage.assignClassItems(exampleLibrary.address, gettextCatalog),
    ...ModelPage.createNewClassItems(exampleLibrary.newClass, gettextCatalog),
    ...ClassForm.addSuperClassItems(ClassView.element, exampleLibrary.newClass.superClass, gettextCatalog),
    ...ClassView.addPropertyUsingExistingPredicateItems(exampleLibrary.newClass.property.name, gettextCatalog),
    ...ClassView.addPropertyBasedOnSuggestionItems(exampleLibrary.newClass.property.passengers, gettextCatalog),
    ...ClassView.addPropertyBasedOnExistingConceptItems(exampleLibrary.newClass.property.owner, gettextCatalog),
    ...ClassForm.addAssociationTargetItems(ClassView.element, exampleLibrary.newClass.property.owner.target, gettextCatalog),
    ClassView.saveClassChanges,
    VisualizationView.focusVisualization
  ];
}

function createNewProfileItems(gettextCatalog: gettextCatalog): Story[] {

  return [
    ...FrontPage.startModelCreation('profile'),
    NewModelPage.enterModelLabel('profile', exampleProfile.name, gettextCatalog),
    NewModelPage.enterModelLanguage,
    NewModelPage.enterModelPrefix(exampleProfile.prefix),
    NewModelPage.addClassification,
    SearchClassificationModal.selectClassification(exampleProfile.classification.name, exampleProfile.classification.id),
    NewModelPage.focusClassifications,
    NewModelPage.addContributor,
    SearchOrganizationsModal.selectOrganization(exampleProfile.organization.name, exampleProfile.organization.id),
    NewModelPage.focusContributors,
    NewModelPage.saveUnsavedModel,
    ModelPage.openModelDetails('profile'),
    ModelView.modifyModel('profile'),
    ...ModelView.addVocabularyItems(exampleProfile.vocabulary, gettextCatalog),
    ...ModelView.addNamespaceItems(exampleProfile.importedLibrary, gettextCatalog),
    ModelView.saveModelChanges,
    ...ModelPage.specializeClassItems(exampleProfile.specializedClass, gettextCatalog),
    ...ModelPage.createNewClassItems(exampleProfile.newClass, gettextCatalog),
    ...ClassView.addPropertyUsingExistingPredicateItems(exampleProfile.newClass.property.name, gettextCatalog),
    ...ClassView.addPropertyBasedOnSuggestionItems(exampleProfile.newClass.property.produced, gettextCatalog),
    ...ClassForm.addAssociationTargetItems(ClassView.element, exampleProfile.newClass.property.produced.target, gettextCatalog),
    ClassView.saveClassChanges,
    VisualizationView.focusVisualization
  ];
}

export function finishedCreateNewModelNotification(type: KnownModelType): Notification {
  return createNotification({
    title: `Congratulations for completing ${type} creation!`,
    content: `Congratulations for completing ${type} creation! description`
  });
}

function createNewModel(type: KnownModelType, gettextCatalog: gettextCatalog): StoryLine {
  return {
    title: `Guide through creating new ${type}`,
    description: `Guide through creating new ${type} description`,
    items: () => [
      ...(type === 'profile' ? createNewProfileItems(gettextCatalog) : createNewLibraryItems(gettextCatalog)),
      finishedCreateNewModelNotification(type)
    ]
  };
}

export class FrontPageHelpService {

  /* @ngInject */
  constructor(private $uibModalStack: IModalStackService, private $location: ILocationService, private gettextCatalog: gettextCatalog) {
  }

  private returnToFrontPage() {
    this.$uibModalStack.dismissAll();
    this.$location.url('/');
  }

  getHelps(): InteractiveHelp[] {
    return [
      createHelpWithDefaultHandler(createNewModel('library', this.gettextCatalog), this.returnToFrontPage.bind(this)),
      createHelpWithDefaultHandler(createNewModel('profile', this.gettextCatalog), this.returnToFrontPage.bind(this))
    ];
  }
}
