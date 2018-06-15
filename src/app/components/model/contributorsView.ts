import { IAttributes, IScope } from 'angular';
import { LanguageService } from 'app/services/languageService';
import { ColumnDescriptor, TableDescriptor } from 'app/components/form/editableTable';
import { module as mod } from './module';
import { collectProperties } from 'yti-common-ui/utils/array';
import { EditableForm } from '../form/editableEntityController';
import { LanguageContext } from '../../types/language';
import { Organization } from '../../entities/organization';
import { SearchOrganizationModal } from './searchOrganizationModal';
import { modalCancelHandler } from '../../utils/angular';
import { createExistsExclusion } from '../../utils/exclusion';

interface WithContributors {
  contributors: Organization[];
  addContributor(organization: Organization): void;
  removeContributor(organization: Organization): void;
}

mod.directive('contributorsView', () => {
  return {
    scope: {
      value: '=',
      context: '='
    },
    restrict: 'E',
    template: `
      <h4>
        <span translate>Contributors</span> 
        <button type="button" class="btn btn-link btn-xs pull-right" ng-click="ctrl.addContributor()" ng-show="ctrl.isEditing()">
          <span translate>Add contributor</span>
        </button>
      </h4>
      <editable-table descriptor="ctrl.descriptor" expanded="ctrl.expanded"></editable-table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['contributorsView', '?^form'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [thisController, formController]: [ContributorsViewController, EditableForm]) {
      thisController.isEditing = () => formController && formController.editing;
    },
    controller: ContributorsViewController
  };
});

class ContributorsViewController {

  value: WithContributors;
  context: LanguageContext;
  isEditing: () => boolean;

  descriptor: ContributorsTableDescriptor;
  expanded: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              languageService: LanguageService,
              private searchOrganizationModal: SearchOrganizationModal) {

    $scope.$watch(() => this.value, value => {
      this.descriptor = new ContributorsTableDescriptor(value, this.context, languageService);
    });
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
