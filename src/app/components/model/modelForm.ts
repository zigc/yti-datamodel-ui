import { Model } from 'app/entities/model';
import { LegacyComponent } from 'app/utils/angular';
import { EditableForm } from 'app/components/form/editableEntityController';

@LegacyComponent({
  bindings: {
    id: '=',
    model: '=',
    namespacesInUse: '<',
    statusChanged: '=',
    changeResourceStatusesToo: '='
  },
  require: {
    form: '?^form'
  },
  template: require('./modelForm.html')
})
export class ModelFormComponent {

  model: Model;
  namespacesInUse?: Set<string>;
  form: EditableForm;
  statusChanged: boolean;
  changeResourceStatusesToo: boolean;

  get allowProfiles() {
    return this.model.isOfType('profile');
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  toggleChangeResourceStatusesToo() {

    // Tämän metodin voisi ehkä välittää tänne ylempää... ???

    // this.changeCodeStatusesToo = !this.changeCodeStatusesToo;
    // this.codeSchemeForm.patchValue({ changeCodeStatuses: !this.codeSchemeForm.controls['changeCodeStatuses'].value });
  }

  showChangeResourceStatusesCheckbox(): boolean {

    // NEXT: Pitää tunnistaa milloin status on vaihtunut ja palauttaa täältä true vain silloin.

    // console.log('changeResourceStatusesToo', this.changeResourceStatusesToo);

    // return this.form.editing && this.statusChanged && this.codesOfTheCodeScheme.length > 0;
    return this.form.editing;
  }

}
