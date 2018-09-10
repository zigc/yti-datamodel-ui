import { Localizer } from 'app/services/languageService';
import { Concept } from 'app/entities/vocabulary';
import { Model } from 'app/entities/model';
import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const ConceptFormComponent: ComponentDeclaration = {
  selector: 'conceptForm',
  bindings: {
    concept: '=',
    model: '='
  },
  template: require('./conceptForm.html'),
  controller: forwardRef(() => ConceptFormController)
};

export class ConceptFormController {

  concept: Concept;
  model: Model;
  localizer: Localizer;
}
