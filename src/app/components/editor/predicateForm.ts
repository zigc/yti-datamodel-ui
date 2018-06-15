import { module as mod } from './module';
import { IScope, IAttributes } from 'angular';
import { isDefined } from 'yti-common-ui/utils/object';
import { UsageService } from 'app/services/usageService';
import { ErrorModal } from 'app/components/form/errorModal';
import { PredicateService } from 'app/services/predicateService';
import { glyphIconClassForType } from 'app/utils/entity';
import { EditableForm } from 'app/components/form/editableEntityController';
import { PredicateViewController } from './predicateView';
import { Model } from 'app/entities/model';
import { Attribute, Association } from 'app/entities/predicate';
import { KnownPredicateType } from 'app/types/entity';

mod.directive('predicateForm', () => {
  return {
    scope: {
      id: '=',
      predicate: '=',
      oldPredicate: '=',
      model: '='
    },
    restrict: 'E',
    template: require('./predicateForm.html'),
    bindToController: true,
    controllerAs: 'ctrl',
    require: ['predicateForm', '?^predicateView', '?^form'],
    link(_$scope: IScope,
         _element: JQuery,
         _attributes: IAttributes,
         [predicateFormController, predicateViewController, formController]: [PredicateFormController, PredicateViewController, EditableForm]) {
      predicateFormController.isEditing = () => formController && formController.editing;
      predicateFormController.shouldAutofocus = !isDefined(predicateViewController);
    },
    controller: PredicateFormController
  };
});

class PredicateFormController {

  model: Model;
  predicate: Attribute|Association;
  oldPredicate: Attribute|Association;
  isEditing: () => boolean;
  shouldAutofocus: boolean;

  /* @ngInject */
  constructor(private predicateService: PredicateService,
              private usageService: UsageService,
              private errorModal: ErrorModal) {
  }

  linkToIdProperty() {
    return this.model.linkToResource(this.predicate.id);
  }

  linkToSuperProperty() {
    return this.model.linkToResource(this.predicate.subPropertyOf);
  }

  linkToValueClass() {
    const predicate = this.predicate;
    if (predicate instanceof Association) {
      return this.model.linkToResource(predicate.valueClass);
    } else {
      return '';
    }
  }

  get changedType(): KnownPredicateType {
    return this.predicate instanceof Attribute ? 'association' : 'attribute';
  }

  get changeTypeIconClass() {
    return glyphIconClassForType([this.changedType]);
  }

  changeType() {
    this.usageService.getUsage(this.predicate).then(usage => {
      if (usage.referrers.length > 0) {
        this.errorModal.openUsageError('Predicate in use', 'Predicate type cannot be changed because it is already used by following resources', usage, this.model);
      } else {
        this.predicateService.changePredicateType(this.predicate, this.changedType, this.model)
          .then(changedPredicate => this.predicate = changedPredicate);
      }
    });
  }
}
