import { Observable } from 'rxjs/Observable';
import { IPromise } from 'angular';

export function fromIPromise<T>(promise: IPromise<T>): Observable<T> {
  return Observable.fromPromise(promise as any as Promise<T>);
}
