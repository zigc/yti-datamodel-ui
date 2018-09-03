import { Observable } from 'rxjs';
import { IPromise } from 'angular';
import { fromPromise } from 'rxjs/internal-compatibility';

export function fromIPromise<T>(promise: IPromise<T>): Observable<T> {
  return fromPromise(promise as any as Promise<T>);
}
