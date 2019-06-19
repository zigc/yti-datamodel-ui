import { IndexModel, IndexResource } from '../entities/index/indexEntities';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiEndpointWithName } from './config';
import { Observable } from 'rxjs';
import { ClassType, KnownPredicateType } from '../types/entity';
import { map } from 'rxjs/operators';

export type DeepSearchResourceHitList = {
  type?: ClassType | KnownPredicateType;
  totalHitCount: number;
  topHits: IndexResource[];
}

export type ModelSearchRequest = {
  query?: string;
  searchResources: boolean;
  sortLang: string;
  pageSize: number;
  pageFrom: number;
}

export type ModelSearchResponse = {
  totalHitCount: number;
  pageSize: number;
  pageFrom: number;
  models: IndexModel[];
  deepHits: { [modelId: string]: DeepSearchResourceHitList[] };
}

export type ResourceSearchRequest = {
  query?: string;
  type: string;
  isDefinedBy?: string;
  sortLang?: string;
  sortField?: string;
  sortOrder?: string;
  pageSize: string;
  pageFrom?: string;
}

export type ResourceSearchResponse = {
  totalHitCount: number;
  pageSize: number;
  pageFrom: number;
  resources: IndexResource[];
}

@Injectable()
export class IndexSearchService {
  constructor(private http: HttpClient) {
  }

  searchModels(request: ModelSearchRequest): Observable<ModelSearchResponse> {
    const headers = { 'Content-Type': 'application/json' };
    return this.http.post<ModelSearchResponse>(apiEndpointWithName('searchModels'), JSON.stringify(request), { headers });
/*
      // NOTE: Now that the API returns correctly typed deep hit lists the following is unnecessary. Remove when feature is tested. 
      .pipe(map(result => {
        if (result.deepHits) {
          Object.keys(result.deepHits).forEach(id => {
            const hitList = result.deepHits[id];
            if (hitList.length === 1 && !hitList[0].type && hitList[0].topHits.length) {
              const totalResults = hitList[0].totalHitCount > hitList[0].topHits.length ? hitList[0].totalHitCount : 0;
              const tmp: { [type: string]: IndexResource[] } = {};
              hitList[0].topHits.forEach(res => {
                let arr = tmp[res.type];
                if (!arr) {
                  arr = [];
                  tmp[res.type] = arr;
                }
                arr.push(res);
              });
              const types = Object.keys(tmp);
              const newHitLists: DeepSearchResourceHitList[] = [];
              result.deepHits[id] = newHitLists;
              types.forEach(t => newHitLists.push({type: t as ClassType | KnownPredicateType, totalHitCount: totalResults, topHits: tmp[t]}));
            }
          });
        }
        return result;
      }));
*/
  }

  searchResources(request: ResourceSearchRequest): Observable<ResourceSearchResponse> {
    const headers = { 'Content-Type': 'application/json' };
    return this.http.post<ResourceSearchResponse>(apiEndpointWithName('searchResources'), JSON.stringify(request), { headers });
  }
}
