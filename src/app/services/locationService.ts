import { Model } from 'app/entities/model';
import { Localizable } from 'yti-common-ui/types/localization';
import { KnownModelType } from '../types/entity';

export interface Location {
  localizationKey?: string;
  label?: Localizable;
  iowUrl?(): string;
}

const frontPage = { localizationKey: 'Front page', iowUrl: () => '/' };

export class LocationService {
  location: Location = [frontPage];

  private changeLocation(location: Location[]): void {
    location.unshift(frontPage);
    this.location = location;
  }

  atNewModel(type: KnownModelType) {
    this.changeLocation([{ localizationKey: `New ${type} creation` }])
  }

  atModel(model: Model, selection: Location|null): void {
    this.changeLocation(selection ? [model, selection] : [model]);
  }

  atUser(): void {
    this.changeLocation([{
      localizationKey: 'User details',
      iowUrl() {
        return '/#user';
      }
    }]);
  }

  atInformationAboutService() {
    this.changeLocation([{
      localizationKey: 'Information about the service'
    }]);
  }

  atFrontPage(): void {
    this.changeLocation([]);
  }
}
