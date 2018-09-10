/// <reference types="node" />

import { IQService } from 'angular';
import { EntityLoader } from '../src/app/services/entityLoader';
import { httpService } from './requestToAngularHttpService';
import { DefaultPredicateService } from '../src/app/services/predicateService';
import { DefaultModelService } from '../src/app/services/modelService';
import { DefaultClassService } from '../src/app/services/classService';
import { DefaultVocabularyService } from '../src/app/services/vocabularyService';
import { ResetService } from '../src/app/services/resetService';
import { FrameService } from '../src/app/services/frameService';

const argv = require('optimist')
  .default({
    host: 'localhost',
    port: 8084
  })
  .argv;

process.env['API_ENDPOINT'] = `http://${argv.host}:${argv.port}`;

const q = <IQService> require('q');
const frameService = new FrameService();
const modelService = new DefaultModelService(httpService, q, frameService);
const predicateService = new DefaultPredicateService(httpService, q, frameService);
const classService = new DefaultClassService(httpService, q, predicateService, frameService);
const vocabularyService = new DefaultVocabularyService(httpService, frameService);
const resetService = new ResetService(httpService);


export const loader = new EntityLoader(q, modelService, predicateService, classService, vocabularyService, resetService, true);
