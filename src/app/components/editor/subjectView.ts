import { SearchConceptModal } from './searchConceptModal';
import { Class } from 'app/entities/class';
import { Predicate } from 'app/entities/predicate';
import { Model } from 'app/entities/model';
import { ComponentDeclaration, modalCancelHandler } from 'app/utils/angular';
import { ConfigService } from 'app/services/configService';
import { Config } from 'app/entities/config';
import { forwardRef } from '@angular/core';

export const SubjectViewComponent: ComponentDeclaration = {
  selector: 'subjectView',
  bindings: {
    entity: '=',
    model: '=',
    isEditing: '='
  },
  template: require('./subjectView.html'),
  controller: forwardRef(() => SubjectViewController)
};

class SubjectViewController {

  entity: Class|Predicate;
  model: Model;
  isEditing: () => boolean;
  config: Config;

  /* @ngInject */
  constructor(private searchConceptModal: SearchConceptModal,
              private configService: ConfigService) {

    this.configService.getConfig().then(urlConfig => {
      this.config = urlConfig;
    });
  }

  get conceptLink() {
    return this.config && this.config.conceptUrl(this.entity.subject);
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
