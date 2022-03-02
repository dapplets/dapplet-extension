// import { BehaviorSubject } from 'rxjs';
import { statify, BehaviorSubjectProxy } from 'rxjs-proxify';

const ALL_CONTEXTS = Symbol("ALL_CONTEXTS");

export default class State <T> {
  public state: {
    [contextId: string | symbol]: BehaviorSubjectProxy<T>
  } = {};

  constructor(public readonly defaultState: T) {

  }

  public get(id: string) {
    const stateId = (id === null || id === undefined) ? ALL_CONTEXTS : id;

    if (!this.state[stateId]) {
      const subject = statify(this.defaultState);
      // subject.subscribe((v) => {
      //     // ToDo: send data to overlay
      // });

      // ToDo: call `subject.next(value)` when data from overlay is received.

      this.state[stateId] = subject;
    }

    return this.state[stateId];
  }

  public set(id: string, data: Partial<T>) {
    const stateId = (id === null || id === undefined) ? ALL_CONTEXTS : id;

    if (!this.state[stateId]) {
      const subject = statify({ ...this.defaultState, ...data });
      this.state[stateId] = subject;
    } else {
      this.state[stateId].next({ ...this.defaultState, ...data });
    }
  }

  public getAll() {
    return Object.fromEntries(Object.entries(this.state).map(([k, v]) => ([k, v.value])));
  }

  public has(id: string) {
    return Object.prototype.hasOwnProperty.call(this.state, id);
  }
}