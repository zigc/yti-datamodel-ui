import { module as mod } from './module';
import { SearchConceptModal } from './searchConceptModal';
import { Class } from 'app/entities/class';
import { Predicate } from 'app/entities/predicate';
import { Model } from 'app/entities/model';
import { modalCancelHandler } from 'app/utils/angular';
import { ConfigService } from '../../services/configService';
import { UrlConfig } from '../../entities/urlConfig';

mod.directive('subjectView', () => {
  return {
    scope: {
      entity: '=',
      model: '=',
      isEditing: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    restrict: 'E',
    controller: SubjectViewController,
    template: require('./subjectView.html')
  };
});

class SubjectViewController {

  entity: Class|Predicate;
  model: Model;
  isEditing: () => boolean;
  urlConfig: UrlConfig;

  constructor(private searchConceptModal: SearchConceptModal,
              private configService: ConfigService) {

    this.configService.getUrlConfig().then(urlConfig => {
      this.urlConfig = urlConfig;
    });
  }

  get conceptLink() {
    return this.urlConfig && this.urlConfig.conceptUrl(this.entity.subject);
  }

  changeSubject() {

    const normalizedType = this.entity.normalizedType;

    if (normalizedType === 'property') {
      throw new Error('Must be known predicate type');
    }

    this.searchConceptModal.openSelection(this.model.vocabularies, this.model, true, normalizedType)
      .then(concept => this.entity.subject = concept, modalCancelHandler);
  }
}
