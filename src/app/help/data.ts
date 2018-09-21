import { classIdFromPrefixAndName, modelIdFromPrefix, predicateIdFromPrefixAndName } from 'app/help/utils';
import { KnownModelType, KnownPredicateType } from 'app/types/entity';
import { helpOrganizationId, helpOrganizationName } from './services/helpOrganizationService';
import { helpConceptIdForIndex, helpVocabularyId, helpVocabularyName } from './services/helpVocabularyService';
import { VocabularyDefinition } from 'app/services/entityLoader';
import { Localizable } from 'yti-common-ui/types/localization';

// TODO: more complete data with localizations to all UI languages

export const helpVocabulary: VocabularyDefinition = [
  {
    label: { fi: 'omistaja', en: 'owner' },
    definition: { fi: 'omistajan määritelmä', en: 'owner definition' }
  }
];

export const helpImportedLibrary = {
  model: {
    type: 'library' as KnownModelType,
    prefix: 'jhs',
    label: {
      fi: 'Julkishallinnon tietokomponentit',
      en: 'Finnish Public Sector Core Components'
    },
    organizations: [helpOrganizationId],
    vocabularies: [helpVocabularyId],
    classifications: ['P9'],
  },
  classes: {
    person: {
      label: { fi: 'Henkilö', en: 'Person' }
    },
    contact: {
      label: { fi: 'Yhteystiedot', en: 'Contact' }
    },
    address: {
      label: { fi: 'Osoite', en: 'Address' }
    },
    code: {
      label: { fi: 'Koodi', en: 'Code' }
    },
    vehicle: {
      label: { fi: 'Liikenneväline', en: 'Vehicle' },
      properties: [
        { predicate: predicateIdFromPrefixAndName('jhs', 'Rekisterinumero') },
        { predicate: predicateIdFromPrefixAndName('jhs', 'Lajikoodi') }
      ]
    },
    service: {
      label: { fi: 'Palvelu', en: 'Service' },
      properties: [
        { predicate: predicateIdFromPrefixAndName('jhs', 'Nimi') },
        { predicate: predicateIdFromPrefixAndName('jhs', 'Kuvaus') }
      ]
    }
  },
  attributes: {
    registrationNumber: {
      label: { fi: 'Rekisterinumero', en: 'Registration number' }
    },
    name: {
      label: { fi: 'Nimi', en: 'Name' }
    },
    description: {
      label: { fi: 'Kuvaus', en: 'Description' }
    },
  },
  associations: {
    categoryCode: {
      label: { fi: 'Lajikoodi', en: 'Category code' },
      valueClass: classIdFromPrefixAndName('jhs', 'Koodi')
    }
  }
};

export const helpLibrary = {
  model: {
    type: 'library' as KnownModelType,
    prefix: 'sea',
    label: { fi: 'Merenkulun tietokomponentit', en: 'Seafaring information components' },
    comment: { fi: 'Merenkulun tietokomponentit', en: 'Seafaring information components' },
    organizations: [helpOrganizationId],
    vocabularies: [helpVocabularyId],
    classifications: ['P16'],
    namespaces: [modelIdFromPrefix(helpImportedLibrary.model.prefix)]
  },
  importedLibrary: {
    prefix: helpImportedLibrary.model.prefix,
    id: modelIdFromPrefix(helpImportedLibrary.model.prefix)
  },
  vocabulary: {
    name: helpVocabularyName,
    id: helpVocabularyId,
  },
  classification: {
    name: { fi: 'Liikenne', en: 'Transport' } as Localizable,
    id: 'http://urn.fi/URN:NBN:fi:au:ptvl:v1142'
  },
  organization: {
    name: helpOrganizationName,
    id: helpOrganizationId
  },
  person: {
    prefix: helpImportedLibrary.model.prefix,
    details: helpImportedLibrary.classes.person
  },
  contact: {
    prefix: helpImportedLibrary.model.prefix,
    details: helpImportedLibrary.classes.contact,
  },
  address: {
    prefix: helpImportedLibrary.model.prefix,
    details: helpImportedLibrary.classes.address
  },
  newClass: {
    label: { fi: 'Vene', en: 'Boat'} as Localizable,
    comment: { fi: 'Vedessä kulkeva alus, joka on laivaa pienempi', en: 'Vehicle operating in water' } as Localizable,
    superClass: {
      prefix: helpImportedLibrary.model.prefix,
      details: helpImportedLibrary.classes.vehicle,
      properties: [
        predicateIdFromPrefixAndName(helpImportedLibrary.model.prefix, 'Rekisterinumero'),
        predicateIdFromPrefixAndName(helpImportedLibrary.model.prefix, 'Lajikoodi')
      ]
    },
    property: {
      name: {
        type: 'attribute' as KnownPredicateType,
        prefix: helpImportedLibrary.model.prefix,
        details: helpImportedLibrary.attributes.name
      },
      passengers: {
        type: 'attribute' as KnownPredicateType,
        label: { fi: 'Matkustajien lukumäärä', en: 'Number of passengers' } as Localizable,
        comment: { fi: 'Matkustajien lukumäärä', en: 'Number of passengers' } as Localizable
      },
      owner: {
        type: 'association' as KnownPredicateType,
        name: { fi: 'Omistaja', en: 'Owner' },
        conceptId: helpConceptIdForIndex(0),
        target: {
          prefix: helpImportedLibrary.model.prefix,
          details: helpImportedLibrary.classes.person
        }
      }
    }
  },
};

export const helpProfile = {
  model: {
    type: 'profile' as KnownModelType,
    prefix: 'plv',
    label: { fi: 'Palveluprofiili', en: 'Service profile' },
    comment: { fi: 'Palveluprofiili', en: 'Service profile' },
    organizations: [helpOrganizationId],
    vocabularies: [helpVocabularyId],
    classifications: ['P9'],
    namespaces: [modelIdFromPrefix(helpImportedLibrary.model.prefix)]
  },
  importedLibrary: {
    prefix: helpImportedLibrary.model.prefix,
    id: modelIdFromPrefix(helpImportedLibrary.model.prefix)
  },
  vocabulary: {
    name: helpVocabularyName,
    id: helpVocabularyId,
  },
  classification: {
    name: { fi: 'Yleiset tieto- ja hallintopalvelut', en: 'General information and administrative services' } as Localizable,
    id: 'http://urn.fi/URN:NBN:fi:au:ptvl:v1095',
  },
  organization: {
    name: helpOrganizationName,
    id: helpOrganizationId
  },
  newClass: {
    label: { fi: 'Tuote', en: 'Product'} as Localizable,
    comment: { fi: 'Asia joka tuotetaan', en: 'Thing that is produced'} as Localizable,
    property: {
      name: {
        type: 'attribute' as KnownPredicateType,
        prefix: helpImportedLibrary.model.prefix,
        details: helpImportedLibrary.attributes.name
      },
      produced: {
        type: 'association' as KnownPredicateType,
        label: { fi: 'Tuotetaan palvelussa', en: 'Produced in a service'} as Localizable,
        comment: { fi: 'Tapahtumaketju joka toteuttaa jotain', en: 'Event chain that produces something'} as Localizable,
        target: {
          prefix: 'plv',
          details: helpImportedLibrary.classes.service
        }
      }
    }
  },
  specializedClass: {
    prefix: helpImportedLibrary.model.prefix,
    details: helpImportedLibrary.classes.service,
    properties: [
      predicateIdFromPrefixAndName(helpImportedLibrary.model.prefix, 'Nimi'),
      predicateIdFromPrefixAndName(helpImportedLibrary.model.prefix, 'Kuvaus')
    ]
  }
};
