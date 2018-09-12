import { IScope } from 'angular';
import { LanguageService } from 'app/services/languageService';
import { ColumnDescriptor, TableDescriptor } from 'app/components/form/editableTable';
import { collectProperties } from 'yti-common-ui/utils/array';
import { EditableForm } from 'app/components/form/editableEntityController';
import { LanguageContext } from 'app/types/language';
import { Organization } from 'app/entities/organization';
import { SearchOrganizationModal } from './searchOrganizationModal';
import { ComponentDeclaration, modalCancelHandler } from 'app/utils/angular';
import { createExistsExclusion } from 'app/utils/exclusion';
import { forwardRef } from '@angular/core';

interface WithContributors {
  contributors: Organization[];
  addContributor(organization: Organization): void;
  removeContributor(organization: Organization): void;
}

export const ContributosViewComponent: ComponentDeclaration = {
  selector: 'contributorsView',
  bindings: {
    value: '=',
    context: '='
  },
  require: {
    form: '?^form'
  },    template: `
      <h4>
        <span translate>Contributors</span> 
        <button id="add_contributor_button" type="button" class="btn btn-link btn-xs pull-right" ng-click="$ctrl.addContributor()" ng-show="$ctrl.isEditing()">
          <span translate>Add contributor</span>
        </button>
      </h4>
      <editable-table id="'contributors'" descriptor="$ctrl.descriptor" expanded="$ctrl.expanded"></editable-table>
  `,
  controller: forwardRef(() => ContributorsViewController)
};

class ContributorsViewController {

  value: WithContributors;
  context: LanguageContext;

  descriptor: ContributorsTableDescriptor;
  expanded: boolean;

  form: EditableForm;

  constructor(private $scope: IScope,
              private languageService: LanguageService,
              private searchOrganizationModal: SearchOrganizationModal) {
    'ngInject';
  }

  $onInit() {
    this.$scope.$watch(() => this.value, value => {
      this.descriptor = new ContributorsTableDescriptor(value, this.context, this.languageService);
    });
  }

  isEditing() {
    return this.form && this.form.editing;
  }

  addContributor() {

    const organizationIds = collectProperties(this.value.contributors, c => c.id.uri);
    const exclude = createExistsExclusion(organizationIds);

    this.searchOrganizationModal.open(exclude)
      .then((organization: Organization) => {
        this.value.addContributor(organization);
        this.expanded = true;
      }, modalCancelHandler);
  }
}

class ContributorsTableDescriptor extends TableDescriptor<Organization> {

  constructor(private value: WithContributors, private context: LanguageContext, private languageService: LanguageService) {
    super();
  }

  columnDescriptors(): ColumnDescriptor<Organization>[] {
    return [
      { headerName: 'Name', nameExtractor: c => this.languageService.translate(c.label, this.context) }
    ];
  }

  values(): Organization[] {
    return this.value && this.value.contributors;
  }

  canEdit(_organization: Organization): boolean {
    return false;
  }

  canRemove(organization: Organization): boolean {
    return this.value.contributors.length > 0;
  }

  remove(organization: Organization): any {
    this.value.removeContributor(organization);
  }

  hasOrder(): boolean {
    return true;
  }
}
