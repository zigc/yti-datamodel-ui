import { IModalService, IModalServiceInstance } from 'angular-ui-bootstrap';
import { InteractiveHelp } from 'app/help/contract';
import { InteractiveHelpDisplay } from 'app/help/components/interactiveHelpDisplay';
import { labelNameToResourceIdIdentifier } from 'yti-common-ui/utils/resource';
import { TranslateService } from '@ngx-translate/core';

export class HelpSelectionModal {

  constructor(private $uibModal: IModalService) {
    'ngInject';
  }

  open(helps: InteractiveHelp[]) {
    return this.$uibModal.open({
      template: `
        <div class="help-selection">
        
          <div class="modal-header">
            <h4 class="modal-title">
              <a><i id="cancel_help_selection_button" ng-click="$dismiss('cancel')" class="fas fa-times"></i></a>
              <span translate>Select help topic</span>
            </h4>
          </div>
        
          <div class="modal-body full-height">
            <div class="content-box scrolling">
              <div class="search-results">            
                <div id="{{$ctrl.getHelpLinkId(help.storyLine.title)}}" class="search-result" ng-repeat="help in $ctrl.helps" ng-click="$ctrl.startHelp(help)">
                  <div class="content" ng-class="{last: $last}">
                    <div class="title">{{help.storyLine.title | translate}}</div>
                    <div class="body">{{help.storyLine.description | translate}}</div>                  
                  </div>
                </div>
              </div>
            </div>
          </div>
         
          <div class="modal-footer">
            <button id="close_help_selection_button" class="btn btn-link" type="button" ng-click="$dismiss('cancel')" translate>Close</button>
          </div>
        </div>
      `,
      size: 'md',
      controllerAs: '$ctrl',
      controller: HelpSelectionModalController,
      resolve: {
        helps: () => helps
      }
    }).result;
  }
}

class HelpSelectionModalController {

  constructor(private $uibModalInstance: IModalServiceInstance,
              public helps: InteractiveHelp[],
              private interactiveHelpDisplay: InteractiveHelpDisplay,
              private translateService: TranslateService) {
    'ngInject';
  }

  startHelp(help: InteractiveHelp) {
    this.$uibModalInstance.close();
    this.interactiveHelpDisplay.open(help);
  }

  getHelpLinkId(title: string) {
    return `${labelNameToResourceIdIdentifier(this.translateService.instant(title))}_help_link`;
  }
}
