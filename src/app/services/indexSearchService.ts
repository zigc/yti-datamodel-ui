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
  query: string;
  type: string;
  isDefinedBy: string;
  sortLang: string;
  sortField: string;
  sortOrder: string;
  pageSize: string;
  pageFrom: string;
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
  }

  searchResources(request: ResourceSearchRequest): Observable<ResourceSearchResponse> {
    const headers = { 'Content-Type': 'application/json' };
    return this.http.post<ResourceSearchResponse>(apiEndpointWithName('searchResources'), JSON.stringify(request), { headers });
  }
}
