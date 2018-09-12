import { IScope } from 'angular';
import { ColumnDescriptor, TableDescriptor } from 'app/components/form/editableTable';
import { Model, Namespace, NamespaceType } from 'app/entities/model';
import { ComponentDeclaration } from 'app/utils/angular';
import { forwardRef } from '@angular/core';

export const TechnicalNamespacesComponent: ComponentDeclaration = {
  selector: 'technicalNamespaces',
  bindings: {
    model: '='
  },
  template: `
      <h4 translate>Technical namespaces</h4>
      <editable-table id="'technicalNamespaces'" descriptor="$ctrl.descriptor" expanded="$ctrl.expanded"></editable-table>
  `,
  controller: forwardRef(() => TechnicalNamespacesController)
};

class TechnicalNamespacesController {
  model: Model;
  descriptor: TechnicalNamespaceTableDescriptor;
  expanded = false;

  constructor(private $scope: IScope) {
    'ngInject';
  }

  $onInit() {
    this.$scope.$watch(() => this.model, model => {
      this.descriptor = new TechnicalNamespaceTableDescriptor(model);
    });
  }
}

class TechnicalNamespaceTableDescriptor extends TableDescriptor<Namespace> {

  namespaces: Namespace[];

  constructor(model: Model) {
    super();
    this.namespaces = model.getNamespaces().filter(ns => ns.namespaceType === NamespaceType.IMPLICIT_TECHNICAL);
  }

  columnDescriptors(): ColumnDescriptor<Namespace>[] {
    return [
      { headerName: 'Prefix', nameExtractor: ns => ns.prefix, cssClass: 'prefix' },
      { headerName: 'Namespace', nameExtractor: ns => ns.url }
    ];
  }

  values(): Namespace[] {
    return this.namespaces;
  }

  orderBy(ns: Namespace) {
    return ns.prefix;
  }

  canEdit(_ns: Namespace): boolean {
    return false;
  }

  canRemove(_ns: Namespace): boolean {
    return false;
  }
}
