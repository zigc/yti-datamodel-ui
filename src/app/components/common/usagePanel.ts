import { module as mod } from './module';
import { IScope } from 'angular';
import { UsageService } from 'app/services/usageService';
import { EditableEntity } from 'app/types/entity';
import { LanguageContext } from 'app/types/language';
import { Usage } from 'app/entities/usage';

mod.directive('usagePanel', () => {
  return {
    restrict: 'E',
    scope: {
      id: '=',
      entity: '=',
      context: '='
    },
    template: require('./usagePanel.html'),
    bindToController: true,
    controllerAs: 'ctrl',
    controller: UsagePanelController
  };
});

class UsagePanelController {

  entity: EditableEntity;
  context: LanguageContext;
  usage: Usage|null = null;
  open = false;
  loading: boolean;

  /* @ngInject */
  constructor($scope: IScope, private usageService: UsageService) {
    $scope.$watch(() => this.open, () => this.updateUsage());
    $scope.$watch(() => this.entity, () => this.updateUsage());
  }

  hasReferrers() {
    return this.usage && this.usage.referrers.length > 0;
  }

  private updateUsage() {
    if (this.open) {
      if (!this.usage || this.usage.id.notEquals(this.entity.id)) {
        this.loading = true;
        this.usageService.getUsage(this.entity).then(usage => {
          this.usage = usage;
          this.loading = false;
        });
      }
    } else {
      this.usage = null;
    }
  }
}
