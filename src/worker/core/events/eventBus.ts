import { Observable, Subject } from 'rxjs'
import { filter, takeUntil } from 'rxjs/operators'
import { BaseEvent } from './baseEvent'

export class EventBus {
  private destroy$ = new Subject()

  constructor(private _eventStream: Observable<BaseEvent>) {}

  ofType<T extends BaseEvent>(type: string): Observable<T> {
    return this._eventStream.pipe(
      takeUntil(this.destroy$),
      filter((e) => e.type === type)
    ) as Observable<T>
  }

  destroy() {
    this.destroy$.next(true) // true is here because ts requires some value
  }
}
