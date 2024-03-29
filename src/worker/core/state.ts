import { BehaviorSubjectProxy, statify } from 'rxjs-proxify'
import { Connection } from './connection'
import { ISharedState } from './types'

const ALL_CONTEXTS = Symbol('ALL_CONTEXTS')

export type State<T> = GeneralState<T> & { [key: string]: BehaviorSubjectProxy<T> }

interface IState {
  new <T = {}>(defaultState: T, type?: string): State<T>
}

class GeneralState<T> implements ISharedState<T> {
  public state: {
    [contextId: string | symbol]: BehaviorSubjectProxy<T>
  }
  public global: BehaviorSubjectProxy<T>
  private _connection: Connection<T>

  constructor(public readonly defaultState: T, public readonly type?: string) {
    this.global = statify(defaultState)
    if (this.type !== 'server')
      this.global.subscribe(() => this._connection?.send('changeSharedState'))
    this.state = { global: this.global }
    return new Proxy(this, {
      get(target, prop: string) {
        if (prop in target) {
          return target[prop]
        } else {
          return target.get(prop)
        }
      },
    })
  }

  public addConnection(conn: Connection<T>) {
    this._connection = conn
    if (this.type === 'server') this._resolveServerData('global')
  }

  public get(id: string) {
    if (id === 'undefined') return
    const stateId = id === null || id === undefined ? ALL_CONTEXTS : id
    if (stateId === ALL_CONTEXTS) return this.global
    if (!this.state[stateId]) {
      const subject = statify(this.defaultState)
      if (this.type !== 'server')
        subject.subscribe(() => this._connection?.send('changeSharedState'))
      this.state[stateId] = subject
      if (this.type === 'server') this._resolveServerData(stateId)
    }
    return this.state[stateId]
  }

  public set(data: Partial<T>, id?: string | symbol) {
    if (id === 'undefined') return
    const stateId = id === null || id === undefined ? ALL_CONTEXTS : id
    if (stateId === ALL_CONTEXTS)
      Object.keys(data).forEach((param) => this.global[param].next(data[param]))
    if (!this.state[stateId]) {
      const subject = statify({ ...this.defaultState, ...data })
      this.state[stateId] = subject
    } else {
      Object.keys(data).forEach((param) => this.state[stateId][param].next(data[param]))
    }
  }

  public getAll() {
    return Object.fromEntries(Object.entries(this.state).map(([k, v]) => [k, v.value]))
  }

  private _resolveServerData(id: string) {
    Object.keys(this.defaultState).forEach((key) => {
      this._connection.subscribeToObservable(id, key, (v) => this.get(id)[key].next(v))
    })
  }
}

export const State = GeneralState as any as IState
