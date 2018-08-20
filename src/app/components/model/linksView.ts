import { IAttributes, IScope } from 'angular';
import { AddEditLinkModal } from './addEditLinkModal';
import { LanguageService } from 'app/services/languageService';
import { TableDescriptor, ColumnDescriptor } from 'app/components/form/editableTable';
import { module as mod } from './module';
import { Link } from 'app/entities/model';
import { modalCancelHandler } from 'app/utils/angular';
import { LanguageContext } from 'app/types/language';
import { EditableForm } from 'app/components/form/editableEntityController';

interface WithLinks {
  links: Link[];
  addLink(link: Link): void;
  removeLink(link: Link): void;
}

mod.directive('linksView', () => {
  return {
    scope: {
      value: '=',
      context: '='
    },
    restrict: 'E',
    template: `
      <h4>
        <span translate>Links</span> 
        <button id="add_link_button" type="button" class="btn btn-link btn-xs pull-right" ng-click="ctrl.addLink()" ng-show="ctrl.isEditing()">
          <span translate>Add link</span>
        </button>
      </h4>
      <editable-table id="'links'" descriptor="ctrl.descriptor" expanded="ctrl.expanded"></editable-table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['linksView', '?^form'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [thisController, formController]: [LinksViewController, EditableForm]) {
      thisController.isEditing = () => formController && formController.editing;
    },
    controller: LinksViewController
  };
});

class LinksViewController {

  value: WithLinks;
  context: LanguageContext;
  isEditing: () => boolean;

  descriptor: LinkTableDescriptor;
  expanded = false;

  constructor($scope: IScope, private addEditLinkModal: AddEditLinkModal, private languageService: LanguageService) {
    $scope.$watch(() => this.value, value => {
      this.descriptor = new LinkTableDescriptor(addEditLinkModal, value, this.context, languageService);
    });
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
