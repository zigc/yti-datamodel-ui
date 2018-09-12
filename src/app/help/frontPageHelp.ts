import { ILocationService } from 'angular';
import { IModalStackService } from 'angular-ui-bootstrap';
import { createNotification, InteractiveHelp, Story, StoryLine, Notification } from './contract';
import { KnownModelType } from 'app/types/entity';
import { gettextCatalog as GettextCatalog } from 'angular-gettext';
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
import { EntityLoaderService } from 'app/services/entityLoader';
import { InteractiveHelpService } from './services/interactiveHelpService';
import { ModelService } from 'app/services/modelService';

function createNewLibraryItems(gettextCatalog: GettextCatalog): Story[] {

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

function createNewProfileItems(gettextCatalog: GettextCatalog): Story[] {

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

function createNewModel(type: KnownModelType, gettextCatalog: GettextCatalog): StoryLine {
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

  constructor(private $uibModalStack: IModalStackService,
              private $location: ILocationService,
              private gettextCatalog: GettextCatalog,
              private modelService: ModelService,
              private entityLoaderService: EntityLoaderService) {
    'ngInject';
  }

  getHelps(): InteractiveHelp[] {

    const returnToFrontPage = () => {
      this.$uibModalStack.dismissAll();
      this.$location.url('/');
    };

    const onInit = (service: InteractiveHelpService) =>
      service.reset().then(() => {

        const entityLoader = this.entityLoaderService.create(false);
        const modelPromise = this.modelService.getModelByPrefix('jhs');

        return entityLoader.createClass(modelPromise, {
          label: {
            fi: 'Liikenneväline'
          },
          properties: [
            {
              predicate: 'http://uri.suomi.fi/datamodel/ns/jhs#rekisterinumero'
            },
            {
              predicate: 'http://uri.suomi.fi/datamodel/ns/jhs#lajikoodi',
              valueClass: 'http://uri.suomi.fi/datamodel/ns/jhs#koodi'
            }
          ]
        }).then(() => false);
      });

    return [
      {
        storyLine: createNewModel('library', this.gettextCatalog),
        onComplete: returnToFrontPage,
        onCancel: returnToFrontPage,
        onInit
      },
      {
        storyLine: createNewModel('profile', this.gettextCatalog),
        onComplete: returnToFrontPage,
        onCancel: returnToFrontPage,
        onInit
      }
    ];
  }
}
