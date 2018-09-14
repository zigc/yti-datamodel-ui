import { IScope } from 'angular';
import { AddEditLinkModal } from './addEditLinkModal';
import { LanguageService } from 'app/services/languageService';
import { ColumnDescriptor, TableDescriptor } from 'app/components/form/editableTable';
import { Link } from 'app/entities/model';
import { LegacyComponent, modalCancelHandler } from 'app/utils/angular';
import { LanguageContext } from 'app/types/language';
import { EditableForm } from 'app/components/form/editableEntityController';

interface WithLinks {
  links: Link[];
  addLink(link: Link): void;
  removeLink(link: Link): void;
}

@LegacyComponent({
  bindings: {
    value: '=',
    context: '='
  },
  require: {
    form: '?^form'
  },
  template: `
      <h4>
        <span translate>Links</span> 
        <button id="add_link_button" type="button" class="btn btn-link btn-xs pull-right" ng-click="$ctrl.addLink()" ng-show="$ctrl.isEditing()">
          <span translate>Add link</span>
        </button>
      </h4>
      <editable-table id="'links'" descriptor="$ctrl.descriptor" expanded="$ctrl.expanded"></editable-table>
  `
})
export class LinksViewComponent {

  value: WithLinks;
  context: LanguageContext;

  descriptor: LinkTableDescriptor;
  expanded = false;

  form: EditableForm;

  constructor(private $scope: IScope,
              private addEditLinkModal: AddEditLinkModal,
              private languageService: LanguageService) {
    'ngInject';
  }

  $onInit() {
    this.$scope.$watch(() => this.value, value => {
      this.descriptor = new LinkTableDescriptor(this.addEditLinkModal, value, this.context, this.languageService);
    });
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  addLink() {
    this.addEditLinkModal.openAdd(this.languageService.getModelLanguage(this.context))
      .then((link: Link) => {
        this.value.addLink(link);
        this.expanded = true;
      }, modalCancelHandler);
  }
}

class LinkTableDescriptor extends TableDescriptor<Link> {

  constructor(private addEditLinkModal: AddEditLinkModal,
              private value: WithLinks,
              private context: LanguageContext,
              private languageService: LanguageService) {
    super();
  }

  columnDescriptors(): ColumnDescriptor<Link>[] {
    return [
      { headerName: 'Title', nameExtractor: link => this.languageService.translate(link.title, this.context), hrefExtractor: link => link.homepage.toString() },
      { headerName: 'Description', nameExtractor: link => this.languageService.translate(link.description, this.context) }
    ];
  }

  values(): Link[] {
    return this.value && this.value.links;
  }

  hasOrder() {
    return true;
  }

  edit(link: Link) {
    this.addEditLinkModal.openEdit(link, this.languageService.getModelLanguage(this.context));
  }

  remove(link: Link) {
    this.value.removeLink(link);
  }

  canEdit(_link: Link): boolean {
    return true;
  }

  canRemove(_link: Link): boolean {
    return true;
  }
}
