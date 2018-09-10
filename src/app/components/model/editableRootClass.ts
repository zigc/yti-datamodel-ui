import { EditableForm } from 'app/components/form/editableEntityController';
import { SearchClassModal } from 'app/components/editor/searchClassModal';
import { requireDefined } from 'yti-common-ui/utils/object';
import { Model } from 'app/entities/model';
import { ClassListItem } from 'app/entities/class';
import { ComponentDeclaration, modalCancelHandler } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const EditableRootClassCompoonent: ComponentDeclaration = {
  selector: 'editableRootClass',
  bindings: {
    model: '='
  },
  require: {
    form: '?^form'
  },
  template: require('./editableRootClass.html'),
  controller: forwardRef(() => EditableRootClassController)
};

class EditableRootClassController {

  model: Model;

  form: EditableForm;

  /* @ngInject */
  constructor(private searchClassModal: SearchClassModal) {
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  get href() {
    return this.model.linkToResource(this.model.rootClass);
  }

  selectClass() {

    const exclude = (klass: ClassListItem) => {
      if (requireDefined(klass.definedBy).id.notEquals(this.model.id)) {
        return 'Can be selected only from this ' + this.model.normalizedType;
      } else {
        return null;
      }
    };

    this.searchClassModal.openWithOnlySelection(this.model, true, exclude)
      .then(klass => this.model.rootClass = klass.id, modalCancelHandler);
  }

  removeClass() {
    this.model.rootClass = null;
  }
}
