import { IQService } from 'angular';
import { createNotification, InteractiveHelp, Story, StoryLine } from './contract';
import { KnownModelType, KnownPredicateType } from 'app/types/entity';
import * as ModelPage from './pages/model/modelPageHelp.po';
import * as ModelView from './pages/model/modelViewHelp.po';
import * as ClassView from './pages/model/classViewHelp.po';
import { helpLibrary, helpProfile } from './data';
import { classIdFromPrefixAndName, isExpectedProperty, predicateIdFromPrefixAndName } from './utils';
import * as ClassForm from './pages/model/classFormHelp.po';
import * as VisualizationView from './pages/model/visualizationViewHelp.po';
import { LanguageService } from 'app/services/languageService';
import { HelpBuilderService, NavigationEvents } from './services/helpBuilder';
import { ClassDetails, PredicateDetails } from 'app/services/entityLoader';
import { Language } from 'app/types/language';
import { Localizable } from 'yti-common-ui/types/localization';
import { modelUrl } from 'app/utils/entity';

function addNamespace(type: KnownModelType, data: { prefix: string, id: string }): StoryLine {
  return {
    title: 'Guide through requiring a namespace',
    description: 'This tutorial shows how to import new namespace to the model',
    items: () => [
      ModelPage.openModelDetails(type),
      ModelView.modifyModel(type),
      ...ModelView.addNamespaceItems(data),
      ModelView.saveModelChanges,
      createNotification({
        title: { key: 'Congratulations for completing namespace require!' }
      })
    ]
  };
}

function specializeClass(klass: { prefix: string, details: ClassDetails, properties: string[] }, lang: Language): StoryLine {
  return {
    title: 'Guide through specializing a class',
    description: 'This tutorial shows how to create a new shape from a class',
    items: () => [
      ...ModelPage.specializeClassItems(klass, lang),
      createNotification({
        title: { key: 'Congratulations for completing specialize class!' }
      })
    ]
  };
}

function assignClass(klass: { prefix: string, details: ClassDetails }, lang: Language): StoryLine {
  return {
    title: 'Guide through assigning class to a library',
    description: 'This tutorial shows how to add Class from existing library',
    items: () => [
      ...ModelPage.assignClassItems(klass, lang),
      createNotification({
        title: { key: 'Congratulations for completing class assignation!' }
      })
    ]
  };
}

function addAttribute(prefix: string,
                      klass: ClassDetails,
                      predicate: { type: KnownPredicateType, prefix: string, details: PredicateDetails },
                      lang: Language): StoryLine {
  return {
    title: 'Guide through adding an attribute',
    description: 'This tutorial shows how to add new attribute',
    items: () => [
      ModelPage.selectClass(prefix, klass, lang),
      ClassView.modifyClass,
      ...ClassView.addPropertyUsingExistingPredicateItems(predicate, lang),
      ClassView.saveClassChanges,
      createNotification({
        title: { key: 'Congratulations for completing adding an attribute!' }
      })
    ]
  };
}

function createNewClass(klass: { label: Localizable, comment: Localizable },
                        propertyByExistingPredicate: { type: KnownPredicateType, prefix: string, details: PredicateDetails },
                        lang: Language): StoryLine {
  return {
    title: 'Guide through creating a class',
    description: 'This tutorial shows how to create a new Class',
    items: () => [
      ...ModelPage.createNewClassItems(klass, lang),
      ...ClassView.addPropertyUsingExistingPredicateItems(propertyByExistingPredicate, lang),
      ClassView.saveClassChanges,
      createNotification({
        title: { key: 'Congratulations for completing new class creation!' }
      })
    ]
  };
}

function addAssociation(prefix: string,
                        klass: ClassDetails,
                        lang: Language,
                        addAssociationItems: () => Story[]): StoryLine {
  return {
    title: 'Guide through adding an association',
    description: 'This tutorial shows how to add association to a Class',
    items: () => [
      ModelPage.selectClass(prefix, klass, lang),
      ClassView.modifyClass,
      ...addAssociationItems(),
      ClassView.saveClassChanges,
      VisualizationView.focusVisualization,
      createNotification({
        title: { key: 'Congratulations for completing adding an association!' }
      })
    ]
  };
}

export class ModelPageHelpService {

  constructor(private $q: IQService,
              private languageService: LanguageService,
              private helpBuilderService: HelpBuilderService) {
    'ngInject';
  }

  getHelps(modelType: KnownModelType, currentModelPrefix: string): InteractiveHelp[] {

    const lang = this.languageService.UILanguage;

    const navigation: NavigationEvents = {
      onStart: modelUrl(modelType === 'profile' ? helpProfile.model.prefix : helpLibrary.model.prefix),
      onEnd: modelUrl(currentModelPrefix)
    };

    const helps = this.helpBuilderService.create(navigation);

    if (modelType === 'profile') {

      helps.add(addNamespace(modelType, helpProfile.importedLibrary), loader => {
        loader.createModel({
          ...helpProfile.model,
          namespaces: []
        });
      });

      helps.add(createNewClass(helpProfile.newClass, helpProfile.newClass.property.name, lang), loader => {
        loader.createModel(helpProfile.model);
      });

      helps.add(specializeClass(helpProfile.specializedClass, lang), loader => {
        loader.createModel(helpProfile.model);
      });

      helps.add(addAttribute(helpProfile.model.prefix, helpProfile.newClass, helpProfile.newClass.property.name, lang), loader => {
        const model = loader.createModel(helpProfile.model);
        loader.createClass(model, {
          label: helpProfile.newClass.label,
          comment: helpProfile.newClass.comment
        });
      });

      helps.add(addAssociation(helpProfile.model.prefix, helpProfile.newClass, lang, () => [
          ...ClassView.addPropertyBasedOnSuggestionItems(helpProfile.newClass.property.produced, lang),
          ...ClassForm.addAssociationTargetItems(ClassView.element, helpProfile.newClass.property.produced.target, lang)
        ]), loader => {

          const model = loader.createModel(helpProfile.model);

          loader.createClass(model, {
            label: helpProfile.newClass.label,
            comment: helpProfile.newClass.comment,
            properties: [
              { predicate: predicateIdFromPrefixAndName(helpProfile.newClass.property.name.prefix, helpProfile.newClass.property.name.details.label.fi) }
            ]
          });

          loader.specializeClass(model, {
            class: classIdFromPrefixAndName(helpProfile.specializedClass.prefix, helpProfile.specializedClass.details.label.fi),
            propertyFilter: isExpectedProperty(helpProfile.specializedClass.properties)
          });
        }
      );

    } else {
      //
      helps.add(addNamespace(modelType, helpLibrary.importedLibrary), loader => {
        loader.createModel({
          ...helpLibrary.model,
          namespaces: []
        });
      });

      helps.add(createNewClass(helpLibrary.newClass, helpLibrary.newClass.property.name, lang), loader => {
        loader.createModel(helpLibrary.model);
      });

      helps.add(assignClass(helpLibrary.person, lang), loader => {
        loader.createModel(helpLibrary.model);
      });

      helps.add(addAttribute(helpLibrary.model.prefix, helpLibrary.newClass, helpLibrary.newClass.property.name, lang), loader => {
        const model = loader.createModel(helpLibrary.model);
        loader.createClass(model, {
          label: helpLibrary.newClass.label,
          comment: helpLibrary.newClass.comment,
          subClassOf: classIdFromPrefixAndName(helpLibrary.newClass.superClass.prefix, helpLibrary.newClass.superClass.details.label.fi)
        });
      });

      helps.add(addAssociation(helpLibrary.model.prefix, helpLibrary.newClass, lang, () => [
        ...ClassView.addPropertyBasedOnExistingConceptItems(helpLibrary.newClass.property.owner, lang),
        ...ClassForm.addAssociationTargetItems(ClassView.element, helpLibrary.newClass.property.owner.target, lang)
      ]), loader => {
        const model = loader.createModel(helpLibrary.model);
        const passengersAttribute = loader.createAttribute(model, helpLibrary.newClass.property.passengers);

        loader.createClass(model, {
          label: helpLibrary.newClass.label,
          comment: helpLibrary.newClass.comment,
          subClassOf: classIdFromPrefixAndName(helpLibrary.newClass.superClass.prefix, helpLibrary.newClass.superClass.details.label.fi),
          properties: [
            { predicate: predicateIdFromPrefixAndName(helpLibrary.newClass.property.name.prefix, helpLibrary.newClass.property.name.details.label.fi) },
            { predicate: passengersAttribute },
          ]
        });

        loader.assignClass(model, classIdFromPrefixAndName(helpLibrary.person.prefix, helpLibrary.person.details.label.fi));
        loader.assignClass(model, classIdFromPrefixAndName(helpLibrary.address.prefix, helpLibrary.address.details.label.fi));
        loader.assignClass(model, classIdFromPrefixAndName(helpLibrary.contact.prefix, helpLibrary.contact.details.label.fi));
      });
    }

    return helps.helps;
  }
}
