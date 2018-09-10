import { Destination } from 'app/types/entity';
import { Model } from 'app/entities/model';
import { normalizeModelType } from 'app/utils/entity';
import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const DefinedByComponent: ComponentDeclaration = {
  selector: 'definedBy',
  bindings: {
    entity: '=',
    model: '='
  },
  template: require('./definedBy.html'),
  controller: forwardRef(() => DefinedByController)
};

class DefinedByController {

  entity: Destination;
  model: Model;

  get definedByTitle() {
    const type = normalizeModelType(this.entity && this.entity.definedBy && this.entity.definedBy.type || []);
    return 'Defined by' + (type ? ' ' + type : '');
  }

  linkTo() {
    return this.entity && this.model.linkToResource(this.entity.id);
  }
}
