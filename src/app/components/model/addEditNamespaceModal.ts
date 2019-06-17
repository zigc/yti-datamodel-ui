import { IPromise, IScope } from 'angular';
import { IModalService, IModalServiceInstance } from 'angular-ui-bootstrap';
import { ModelService } from '../../services/modelService';
import { Language, LanguageContext } from '../../types/language';
import { isDefined } from 'yti-common-ui/utils/object';
import { ImportedNamespace } from '../../entities/model';

const technicalNamespaces: { [prefix: string]: string } = {
  dcap: 'http://purl.org/ws-mmi-dc/terms/',
  schema: 'http://schema.org/',
  void: 'http://rdfs.org/ns/void#',
  adms: 'http://www.w3.org/ns/adms#',
  owl: 'http://www.w3.org/2002/07/owl#',
  dcam: 'http://purl.org/dc/dcam/',
  skosxl: 'http://www.w3.org/2008/05/skos-xl#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  afn: 'http://jena.hpl.hp.com/ARQ/function#',
  skos: 'http://www.w3.org/2004/02/skos/core#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  iow: 'http://uri.suomi.fi/datamodel/ns/iow#',
  sd: 'http://www.w3.org/ns/sparql-service-description#',
  at: 'http://publications.europa.eu/ontology/authority/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  sh: 'http://www.w3.org/ns/shacl#',
  dcterms: 'http://purl.org/dc/terms/',
  text: 'http://jena.apache.org/text#',
  prov: 'http://www.w3.org/ns/prov#',
  termed: 'http://termed.thl.fi/meta/',
  foaf: 'http://xmlns.com/foaf/0.1/',
  dc: 'http://purl.org/dc/elements/1.1/',
  ts: 'http://www.w3.org/2003/06/sw-vocab-status/ns#',
  httpv: 'http://www.w3.org/2011/http#'
};

const forbiddenPrefixes: string[] = ['xsd', 'iow', 'text', 'sh', 'afn', 'schema', 'dcap', 'termed', 'abstract', 'and', 'andCond', 'class',
  'classIn', 'codeLists', 'comment', 'contributor', 'constraint', 'context', 'created', 'creator', 'datatype', 'defaultValue', 'definition',
  'description', 'editorialNote', 'equivalentClass', 'equivalentProperty', 'example', 'first', 'graph', 'hasPart', 'hasValue', 'homepage',
  'id', 'identifier', 'imports', 'inScheme', 'inValues', 'isDefinedBy', 'isPartOf', 'isResourceIdentifier', 'isXmlAttribute',
  'isXmlWrapper', 'last', 'label', 'language', 'languageIn', 'localName', 'maxCount', 'maxLength', 'memberOf', 'minCount', 'name', 'node',
  'nodeKind', 'not', 'notCond', 'or', 'orCond', 'path', 'pattern', 'pointXY', 'preferredXMLNamespaceName', 'preferredXMLNamespacePrefix',
  'prefLabel', 'property', 'predicate', 'range', 'readOnlyValue', 'references', 'relations', 'requires', 'rootResource', 'rest', 'stem',
  'subClassOf', 'subject', 'subPropertyOf', 'targetClass', 'title', 'type', 'uniqueLang', 'useContext', 'uri', 'versionInfo', 'vertexXY',
  'xor', 'urn', 'http', 'https'].filter(prefix => !technicalNamespaces[prefix]);

export class AddEditNamespaceModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  openAdd(context: LanguageContext, language: Language, reservedPrefixes?: string[], usedNamespaces: string[] = []): IPromise<ImportedNamespace> {
    return this.open(context, language, null, this.concatPrefixes(reservedPrefixes), usedNamespaces);
  }

  openEdit(context: LanguageContext, require: ImportedNamespace, language: Language, reservedPrefixes?: string[], usedNamespaces: string[] = []): IPromise<ImportedNamespace> {
    return this.open(context, language, require, this.concatPrefixes(reservedPrefixes), usedNamespaces);
  }

  private concatPrefixes(reservedPrefixes?: string[]): string[] {
    if (reservedPrefixes) {
      return [...reservedPrefixes, ...forbiddenPrefixes];
    }
    return forbiddenPrefixes;
  }

  private open(context: LanguageContext, language: Language, namespaceToEdit: ImportedNamespace | null, reservedPrefixes: string[], usedNamespaces: string[]): IPromise<ImportedNamespace> {
    return this.$uibModal.open({
      template: require('./addEditNamespaceModal.html'),
      size: 'sm',
      controller: AddEditNamespaceController,
      controllerAs: '$ctrl',
      backdrop: true,
      resolve: {
        context: () => context,
        language: () => language,
        namespaceToEdit: () => namespaceToEdit,
        reservedPrefixes: () => reservedPrefixes,
        usedNamespaces: () => usedNamespaces
      }
    }).result;
  }
}

class AddEditNamespaceController {

  namespace: string;
  prefix: string;
  label: string;

  submitError: string;
  edit: boolean;

  namespaceBeforeForced: string | null = null;
  prefixBeforeForced: string | null = null;

  constructor(private $uibModalInstance: IModalServiceInstance,
              $scope: IScope,
              public context: LanguageContext,
              private language: Language,
              private namespaceToEdit: ImportedNamespace | null,
              public reservedPrefixes: string[],
              public usedNamespaces: string[],
              private modelService: ModelService) {
    'ngInject';
    this.edit = !!namespaceToEdit;

    if (namespaceToEdit) {
      this.namespace = namespaceToEdit.namespace;
      this.prefix = namespaceToEdit.prefix;
      this.label = namespaceToEdit.label[language];
    }

    $scope.$watch(() => this.prefix, () => {
      if (this.prefixModifiable()) {

        const namespaceOverrideWasOn = isDefined(this.namespaceBeforeForced);
        let namespaceOverrideSwitchedOn = false;

        for (const [prefix, ns] of Object.entries(technicalNamespaces)) {
          if (prefix === this.prefix) {
            namespaceOverrideSwitchedOn = true;
            this.namespaceBeforeForced = this.namespace || '';
            this.namespace = ns;
          }
        }

        if (namespaceOverrideWasOn && !namespaceOverrideSwitchedOn) {
          this.namespace = this.namespaceBeforeForced!;
          this.namespaceBeforeForced = null;
        }
      }
    });

    $scope.$watch(() => this.namespace, () => {
      if (this.namespaceModifiable()) {

        const prefixOverrideWasOn = isDefined(this.prefixBeforeForced);
        let prefixOverrideSwitchedOn = false;

        for (const [prefix, ns] of Object.entries(technicalNamespaces)) {
          if (ns === this.namespace) {
            prefixOverrideSwitchedOn = true;
            this.prefixBeforeForced = this.prefix || '';
            this.prefix = prefix;
          }
        }

        if (prefixOverrideWasOn && !prefixOverrideSwitchedOn) {
          this.prefix = this.prefixBeforeForced!;
          this.prefixBeforeForced = null;
        }
      }
    });
  }

  get confirmLabel() {
    return this.edit ? 'Edit' : 'Create new';
  }

  get titleLabel() {
    return this.edit ? 'Edit namespace' : 'Import namespace';
  }

  get confirmButtonID() {
    return this.edit ? 'edit_namespace_confirm_button' : 'add_new_namespace_confirm_button';
  }

  labelModifiable() {
    return !this.edit || this.namespaceToEdit!.labelModifiable;
  }

  namespaceModifiable() {
    return (!this.edit || this.namespaceToEdit!.namespaceModifiable) && !isDefined(this.namespaceBeforeForced);
  }

  prefixModifiable() {
    return (!this.edit || this.namespaceToEdit!.prefixModifiable) && !isDefined(this.prefixBeforeForced);
  }

  create() {
    if (this.edit) {
      this.namespaceToEdit!.namespace = this.namespace;
      this.namespaceToEdit!.prefix = this.prefix;
      this.namespaceToEdit!.label[this.language] = this.label;

      this.$uibModalInstance.close(this.mangleAsTechnicalIfNecessary(this.namespaceToEdit!));
    } else {
      this.modelService.newNamespaceImport(this.namespace, this.prefix, this.label, this.language)
        .then(ns => {
          return this.$uibModalInstance.close(this.mangleAsTechnicalIfNecessary(ns));
        }, err => this.submitError = err.data.errorMessage);
    }
  }

  cancel() {
    this.$uibModalInstance.dismiss('cancel');
  }

  // XXX: API should return as technical and shouldn't need mangling
  private mangleAsTechnicalIfNecessary(ns: ImportedNamespace) {

    const isTechnical = isDefined(this.namespaceBeforeForced) || isDefined(this.prefixBeforeForced);

    if (isTechnical) {
      ns.convertAsTechnical();
    }

    return ns;
  }
}
