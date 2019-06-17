import { ClassType, KnownModelType, KnownPredicateType, Type, UseContext } from '../../types/entity';
import { mapType as utilMapType, modelUrl, modelUrl as utilModelUrl, resourceUrl } from '../../utils/entity';
import { Status } from 'yti-common-ui/entities/status';
import { Localizable } from 'yti-common-ui/types/localization';
import { RelativeUrl } from '../uri';

export type IndexModel = {
  /**
   * URI, e.g., "http://uri.suomi.fi/datamodel/ns/edu".
   */
  id: string;
  useContext: UseContext;
  status: Status;
  modified: Date;
  type: KnownModelType;
  prefix: string;
  namespace: string;
  label: Localizable;
  comment?: Localizable;
  /**
   * Array of organization UUIDs without any URN prefixes, e.g., "27400fbf-5fd3-4137-9176-a5ed8040e271".
   */
  contributor: string[];
  /**
   * Array of information domain identifiers (not IDs), e.g., "P2".
   */
  isPartOf: string[];
}

export type IndexResource = {
  /**
   * URI, e.g., "http://uri.suomi.fi/datamodel/ns/edu#Oppiaine".
   */
  id: string;
  /**
   * Model id, i.e., URI.
   */
  isDefinedBy: string;
  status: Status;
  modified: Date;
  type: ClassType | KnownPredicateType;
  label: Localizable;
  comment?: Localizable;
  range?: string;
}

export function getInternalModelUrl(model: IndexModel): RelativeUrl {
  return modelUrl(model.prefix);
}

export function getInternalResourceUrl(model: IndexModel, resource: IndexResource): RelativeUrl {
  const modelUrl = getInternalModelUrl(model);
  const parts = resource.id.split('#');
  if (parts.length === 2) {
    if (model.id === parts[0]) {
      return modelUrl + parts[1] + '/';
    } else if (resource.isDefinedBy === parts[0]) {
      const lio = parts[0].lastIndexOf('/');
      if (lio >= 0) {
        return modelUrl + parts[0].substring(lio + 1) + ':' + parts[1] + '/'
      }
    }
  }
  console.error('Could not resolve route to resouce "' + resource.id + '" (model: "' + model.id + '")');
  return modelUrl;
}
