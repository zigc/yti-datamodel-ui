import { ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { InteractiveHelp } from 'app/help/contract';
import { InteractiveHelpDisplay } from 'app/help/components/interactiveHelpDisplay';

export class HelpSelectionModal {

  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(helps: InteractiveHelp[]) {
    return this.$uibModal.open({
      template: `
        <div class="help-selection">
        
          <div class="modal-header">
            <h4 class="modal-title">
              <a><i ng-click="$dismiss('cancel')" class="fas fa-times"></i></a>
              <span translate>Select help topic</span>
            </h4>
          </div>
        
          <div class="modal-body full-height">
            <div class="content-box scrolling">
              <div class="search-results">            
                <div class="search-result" ng-repeat="help in ctrl.helps" ng-click="ctrl.startHelp(help)">
                  <div class="content" ng-class="{last: $last}">
                    <div class="title">{{help.storyLine.title | translate}}</div>
                    <div class="body">{{help.storyLine.description | translate}}</div>                  
                  </div>
                </div>
              </div>
            </div>
          </div>
         
          <div class="modal-footer">
            <button class="btn btn-link" type="button" ng-click="$dismiss('cancel')" translate>Close</button>
          </div>
        </div>
      `,
      size: 'md',
      controllerAs: 'ctrl',
      controller: HelpSelectionModalController,
      resolve: {
        helps: () => helps
      }
    }).result;
  }
}

class HelpSelectionModalController {

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance, public helps: InteractiveHelp[], private interactiveHelpDisplay: InteractiveHelpDisplay) {
  }

  startHelp(help: InteractiveHelp) {
    this.$uibModalInstance.close();
    this.interactiveHelpDisplay.open(help);
  }
}
