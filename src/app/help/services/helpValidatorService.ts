import { IPromise, IQService } from 'angular';
import { ValidatorService } from 'app/services/validatorService';
import { ResetableService } from './resetableService';
import { Uri } from 'app/entities/uri';
import { InteractiveHelpClassService } from './helpClassService';
import { InteractiveHelpPredicateService } from './helpPredicateService';

export class InteractiveHelpValidatorService implements ValidatorService, ResetableService {

  constructor(private $q: IQService,
              private helpClassService: InteractiveHelpClassService,
              private helpPredicateService: InteractiveHelpPredicateService) {
    'ngInject';
  }

  classDoesNotExist(id: Uri): IPromise<boolean> {
    return this.$q.when(!this.helpClassService.classExists(id));
  }

  predicateDoesNotExist(id: Uri): IPromise<boolean> {
    return this.$q.when(!this.helpPredicateService.predicateExists(id));
  }

  reset(): IPromise<any> {
    return this.$q.when();
  }
}
