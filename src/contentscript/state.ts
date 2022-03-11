// import { BehaviorSubject } from 'rxjs';
import { statify, BehaviorSubjectProxy } from 'rxjs-proxify';
import { IPubSub } from "./types";

const ALL_CONTEXTS = Symbol("ALL_CONTEXTS");

export default class State <T> {
  public state: {
    [contextId: string | symbol]: BehaviorSubjectProxy<T>
  };

  public all: BehaviorSubjectProxy<T>

  private _bus: IPubSub

  constructor(public readonly defaultState: T) {
    this.all = statify(defaultState);
    this.all.subscribe((v) => {
        if (this._bus?.registered) this._bus?.exec('changeState', this.getAll());
    });
    this.state = { all: this.all };
    return new Proxy(this, {
      get(target, prop) {
        if (prop in target) {
          return target[prop];
        } else {
          return target.get(prop);
        }
      }
    });
  }

  public connectToBus(bus: IPubSub) {
    this._bus = bus;
  }

  public get(id: string | symbol) {
    // if (id === undefined || id === 'undefined') return;
    const stateId = (id === null || id === undefined) ? ALL_CONTEXTS : id;

    if (stateId === ALL_CONTEXTS) return this.all;

    if (!this.state[stateId]) {
      const subject = statify(this.defaultState);
      subject.subscribe((v) => {
          if (this._bus?.registered) this._bus?.exec('changeState', this.getAll());
      });

      this.state[stateId] = subject;
    }

    return this.state[stateId];
  }

  public set(data: Partial<T>, id?: string | symbol) {
    // if (id === undefined || id === 'undefined') return;
    const stateId = (id === null || id === undefined) ? ALL_CONTEXTS : id;

    if (stateId === ALL_CONTEXTS) Object.keys(data).forEach((param) => this.all[param].next(data[param]));

    if (!this.state[stateId]) {
      const subject = statify({ ...this.defaultState, ...data });
      this.state[stateId] = subject;
    } else {
      Object.keys(data).forEach((param) => this.state[stateId][param].next(data[param]));
    }
  }

  public getAll() {
    return Object.fromEntries(Object.entries(this.state).map(([k, v]) => ([k, v.value])));
  }

  // public has(id: string | symbol) {
  //   return Object.prototype.hasOwnProperty.call(this.state, id);
  // }
}