import { IScope, IWindowService } from 'angular';
import * as moment from 'moment';
import { LanguageService } from 'app/services/languageService';
import { Model } from 'app/entities/model';
import { Class } from 'app/entities/class';
import { Predicate } from 'app/entities/predicate';
import { LanguageContext } from 'app/types/language';
import { apiEndpointWithName } from 'app/services/config';
import { LegacyComponent } from 'app/utils/angular';

const exportOptions = [
  { type: 'application/ld+json', extension: 'json' },
  { type: 'text/turtle', extension: 'ttl' },
  { type: 'application/rdf+xml', extension: 'rdf' },
  { type: 'application/xml', extension: 'xml' },
  { type: 'application/schema+json', extension: 'json' },
  { type: 'application/ld+json+context', extension: 'json' }
];

const UTF8_BOM = '\ufeff';

type EntityType = Model | Class | Predicate;

function formatFileName(entity: EntityType, extension: string) {
  return `${entity.id.uri.substr('http://'.length)}-${moment().format('YYYY-MM-DD')}.${extension}`;
}

@LegacyComponent({
  bindings: {
    entity: '<',
    context: '<',
    idPrefix: '<'
  },
  template: require('./export.html')
})
export class ExportComponent {

  entity: Model | Class | Predicate;
  context: LanguageContext;
  idPrefix?: string;

  downloads: { name: string, filename: string, href: string, hrefRaw: string, onClick?: () => void }[];

  framedUrlObject: string;
  framedUrlObjectRaw: string;
  frameUrlObject: string;
  frameUrlObjectRaw: string;

  private idCleanerExpression = /[^a-zA-Z0-9_-]/g;

  constructor(private $scope: IScope,
              private $window: IWindowService,
              private languageService: LanguageService) {
    'ngInject';
  }

  $onInit() {

    this.$scope.$watchGroup([() => this.entity, () => this.languageService.getModelLanguage(this.context)], ([entity, lang]) => {
      const hrefBase = entity instanceof Model ? apiEndpointWithName('exportModel') : apiEndpointWithName('exportResource');
      this.downloads = exportOptions.map(option => {
        const href = `${hrefBase}?graph=${encodeURIComponent(entity.id.uri)}&content-type=${encodeURIComponent(option.type)}&lang=${lang}`;

        return {
          name: option.type,
          filename: formatFileName(entity, option.extension),
          href,
          hrefRaw: href + '&raw=true'
        };
      });

      if (Modernizr.bloburls) {
        const framedDataAsString = JSON.stringify({ '@graph': entity.graph, '@context': entity.context }, null, 2);
        const framedDataBlob = new Blob([UTF8_BOM, framedDataAsString], { type: 'application/ld+json;charset=utf-8' });
        const framedDataBlobRaw = new Blob([UTF8_BOM, framedDataAsString], { type: 'text/plain;charset=utf-8' });

        if (this.framedUrlObject) {
          this.$window.URL.revokeObjectURL(this.framedUrlObject);
        }

        if (this.framedUrlObjectRaw) {
          this.$window.URL.revokeObjectURL(this.framedUrlObjectRaw);
        }

        if (this.frameUrlObject) {
          this.$window.URL.revokeObjectURL(this.frameUrlObject);
        }

        if (this.frameUrlObjectRaw) {
          this.$window.URL.revokeObjectURL(this.frameUrlObjectRaw);
        }

        this.framedUrlObject = this.$window.URL.createObjectURL(framedDataBlob);
        this.framedUrlObjectRaw = this.$window.URL.createObjectURL(framedDataBlobRaw);

        if (this.entity.frame) {
          const frameAsString = JSON.stringify(this.entity.frame, null, 2);
          const frameBlob = new Blob([UTF8_BOM, frameAsString], { type: 'application/json;charset=utf-8' });
          const frameBlobRaw = new Blob([UTF8_BOM, frameAsString], { type: 'text/plain;charset=utf-8' });

          this.frameUrlObject = this.$window.URL.createObjectURL(frameBlob);
          this.frameUrlObjectRaw = this.$window.URL.createObjectURL(frameBlobRaw);

          this.downloads.push({
            name: 'ld+json frame',
            filename: 'frame.json',
            href: this.frameUrlObject,
            hrefRaw: this.frameUrlObjectRaw,
            onClick: () => {
              if (window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveOrOpenBlob(frameBlob, 'frame.json');
              }
            }
          });
        }

        this.downloads.push({
          name: 'framed ld+json',
          filename: formatFileName(this.entity, 'json'),
          href: this.framedUrlObject,
          hrefRaw: this.framedUrlObjectRaw,
          onClick: () => {
            if (window.navigator.msSaveOrOpenBlob) {
              window.navigator.msSaveOrOpenBlob(framedDataBlob, formatFileName(this.entity, 'json'));
            }
          }
        });
      }
    });
  }

  getId(thing: string): string | undefined {
    if (this.idPrefix) {
      return this.idPrefix + '_export_' + thing.replace(this.idCleanerExpression, '_');
    }
    return undefined;
  }
}
