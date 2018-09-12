import { IPromise } from 'angular';
import { IModalService } from 'angular-ui-bootstrap';
import { UsageService } from 'app/services/usageService';
import { anyMatching } from 'yti-common-ui/utils/array';
import { isDefined } from 'yti-common-ui/utils/object';
import { LanguageContext } from 'app/types/language';
import { EditableEntity } from 'app/types/entity';
import { Model } from 'app/entities/model';
import { Usage, Referrer } from 'app/entities/usage';

export class DeleteConfirmationModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  open(entity: EditableEntity, context: LanguageContext, onlyInDefinedModel: Model|null = null): IPromise<void> {
    return this.$uibModal.open({
      template: require('./deleteConfirmationModal.html'),
      size: 'adapting',
      controllerAs: '$ctrl',
      controller: DeleteConfirmationModalController,
      resolve: {
        entity: () => entity,
        context: () => context,
        onlyInDefinedModel: () => onlyInDefinedModel
      }
    }).result;
  }
};

class DeleteConfirmationModalController {

  usage: Usage;
  hasReferrers: boolean;

  exclude = (referrer: Referrer) => {
    return isDefined(this.onlyInDefinedModel) && (referrer.isOfType('model')
       || !isDefined(referrer.definedBy) || referrer.definedBy.id.notEquals(this.onlyInDefinedModel.id));
  };

  constructor(public entity: EditableEntity, public context: LanguageContext, private onlyInDefinedModel: Model|null, usageService: UsageService) {
    'ngInject';
    usageService.getUsage(entity).then(usage => {
      this.usage = usage;
      this.hasReferrers = usage && anyMatching(usage.referrers, referrer => !this.exclude(referrer));
    });
  }
}
