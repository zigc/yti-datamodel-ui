import { ConfirmationModalService } from 'yti-common-ui/components/confirmation-modal.component';
import { Injectable } from '@angular/core';

@Injectable()
export class DatamodelConfirmationModalService {

  constructor(private confirmationModalService: ConfirmationModalService) {
  }

  openChangeToRestrictedStatus() {
    return this.confirmationModalService.open('CHANGE STATUS?', undefined,
       'CHANGE_STATUS_CONFIRMATION_PARAGRAPH_1', 'CHANGE_STATUS_CONFIRMATION_PARAGRAPH_2');
  }
}
