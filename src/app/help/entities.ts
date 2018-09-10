import { modelIdFromPrefix } from 'app/help/utils';
import { KnownPredicateType } from 'app/types/entity';
import { helpOrganizationId } from './services/helpOrganizationService';

export const exampleImportedLibrary = {
  prefix: 'jhs',
  namespaceId: 'http://uri.suomi.fi/datamodel/ns/jhs'
};

export const exampleLibrary = {
  prefix: 'sea',
  name: 'Merenkulun tietokomponentit',
  comment: 'Merenkulkuun liittyvät tietosisällöt',
  importedLibrary: exampleImportedLibrary,
  vocabulary: {
    name: 'julkis',
    id: 'http://uri.suomi.fi/terminology/jhs/terminological-vocabulary-1', // FIXME relies on data initialization order
  },
  classification: {
    name: 'Liikenne',
    id: 'http://urn.fi/URN:NBN:fi:au:ptvl:v1142'
  },
  organization: {
    name: 'Ohjeen organisaatio',
    id: helpOrganizationId
  },
  newClass: {
    name: 'Vene',
    comment: 'Vedessä kulkeva alus, joka on laivaa pienempi',
    superClass: {
      namespaceId: exampleImportedLibrary.namespaceId,
      name: 'Liikenneväline',
      properties: ['jhs:lajikoodi', 'jhs:rekisterinumero']
    },
    property: {
      name: {
        type: 'attribute' as KnownPredicateType,
        prefix: exampleImportedLibrary.prefix,
        namespaceId: exampleImportedLibrary.namespaceId,
        name: 'Nimi'
      },
      passengers: {
        type: 'attribute' as KnownPredicateType,
        searchName: 'Matkustajien lukumäärä',
        name: 'Matkustajien lukumäärä',
        comment: 'Matkustajien lukumäärä'
      },
      owner: {
        type: 'association' as KnownPredicateType,
        searchName: 'Omistaja',
        name: 'Omistaja',
        conceptId: 'http://uri.suomi.fi/terminology/jhs/concept1', // FIXME relies on data initialization order
        target: {
          namespaceId: exampleImportedLibrary.namespaceId,
          name: 'Henkilö'
        }
      }
    }
  },
  person: {
    namespaceId: exampleImportedLibrary.namespaceId,
    name: 'Henkilö'
  },
  contact: {
    namespaceId: exampleImportedLibrary.namespaceId,
    name: 'Yhteystiedot'
  },
  address: {
    namespaceId: exampleImportedLibrary.namespaceId,
    name: 'Osoite'
  }
};

export const exampleProfile = {
  prefix: 'plv',
  name: 'Palveluprofiili',
  importedLibrary: exampleImportedLibrary,
  vocabulary: {
    name: 'julkis',
    id: 'http://uri.suomi.fi/terminology/jhs/terminological-vocabulary-1', // FIXME relies on data initialization order
  },
  classification: {
    name: 'Liikenne',
    id: 'http://urn.fi/URN:NBN:fi:au:ptvl:v1142'
  },
  organization: {
    name: 'Ohjeen organisaatio',
    id: helpOrganizationId
  },
  newClass: {
    name: 'Tuote',
    comment: 'Asia joka tuotetaan',
    property: {
      name: {
        type: 'attribute' as KnownPredicateType,
        prefix: exampleImportedLibrary.prefix,
        namespaceId: exampleImportedLibrary.namespaceId,
        name: 'Nimi'
      },
      produced: {
        type: 'association' as KnownPredicateType,
        searchName: 'Tuotetaan',
        name: 'Tuotetaan palvelussa',
        comment: 'tapahtumaketju joka toteuttaa jotain',
        target: {
          namespaceId: modelIdFromPrefix('plv'),
          name: 'Palvelu'
        }
      }
    }
  },
  specializedClass: {
    namespaceId: exampleImportedLibrary.namespaceId,
    name: 'Palvelu',
    properties: ['jhs:nimi', 'jhs:kuvaus']
  }
};
