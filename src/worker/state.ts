export type WidgetConfig<T> = {
  [key: string]: T
} & {
  id?: string
  initial?: string
}

export class State<T> {
  public readonly INITIAL_STATE
  private _currentStateName = undefined
  public state: T
  private _cache: any = {}
  public changedHandler: (newValues: any) => void
  public id: string

  constructor(private config: WidgetConfig<T>, public readonly ctx: any) {
    const me = this
    this.id = config.id
    this.INITIAL_STATE = config.initial || 'DEFAULT'
    this.state = new Proxy(
      {},
      {
        get(target, property, receiver) {
          if (property === 'state') return me._currentStateName
          if (property === 'ctx') return me.ctx
          if (property === 'setState') return me.setState.bind(me)
          if (property === 'id') return me.id

          const value = me._currentStateName
            ? me._cache[me._currentStateName][property]
            : me._cache[property]

          return value
        },
        set(target, property, value, receiver) {
          if (property === 'state') {
            me.setState(value)
          } else if (property === 'newState') {
            me.setState(value, true)
          } else {
            const valueOrObservable = me.config[me._currentStateName][property]
            if (
              valueOrObservable &&
              typeof valueOrObservable === 'function' &&
              valueOrObservable.next &&
              valueOrObservable.subscribe
            ) {
              valueOrObservable.next(value)
            } else if (me._currentStateName) {
              me._cache[me._currentStateName][property] = value
            } else {
              me._cache[property] = value
            }
            me.changedHandler && me.changedHandler({ [property]: value })
          }
          return true
        },
      }
    ) as T
    if (me.config[me.INITIAL_STATE]) me.setState(me.INITIAL_STATE)
  }

  public setState(stateName: string, resetState = false): any {
    do {
      //console.log("Set state from - to: ", this._currentStateName,stateName)
      if (stateName == this._currentStateName) {
        //console.log(`NOP state transition "${stateName}". Skipping...`)
        break
      } else if (!this._cache[stateName] || resetState) {
        this._cache[stateName] = this.createNewStateFromConfig(stateName)
      }
      this._currentStateName = stateName
      stateName = this._cache[stateName].NEXT
    } while (stateName)
    this.changedHandler && this.changedHandler(this.getStateValues())
    return this._cache[this._currentStateName]
  }

  public getStateValues(): T {
    const cachedState = this._currentStateName ? this._cache[this._currentStateName] : this._cache
    return cachedState
  }

  private createNewStateFromConfig(stateName) {
    const state = {}
    if (this.config[stateName]) {
      const isObservable = (value: any) => {
        return value && typeof value === 'function' && value.next && value.subscribe
      }

      const me = this
      Object.entries(this.config[stateName]).forEach(([key, value]) => {
        if (key === undefined || key === 'undefined') return
        const parseWidgetParam = (valueOrApConf, i?: number) => {
          // i - the index of the current element being processed in the array
          if (isObservable(valueOrApConf)) {
            if (i === undefined) {
              state[key] = valueOrApConf.value
              valueOrApConf.subscribe((v) => {
                // ToDo: potential bug
                if (stateName == me._currentStateName) {
                  state[key] = v
                  me.changedHandler && me.changedHandler({ [key]: v })
                }
              })
            } else {
              if (state[key] !== undefined) {
                state[key].push(valueOrApConf.value)
              } else {
                state[key] = [valueOrApConf.value]
              }
              valueOrApConf.subscribe((v) => {
                // ToDo: potential bug
                if (stateName == me._currentStateName) {
                  state[key][i] = v
                  me.changedHandler && me.changedHandler({ [key]: v })
                }
              })
            }
          } else if (i !== undefined) {
            if (state[key] !== undefined) {
              state[key].push(valueOrApConf)
            } else {
              state[key] = [valueOrApConf]
            }
          } else {
            state[key] = valueOrApConf
          }
        }

        /* Using arrays of values is not supported yet */

        // if (Array.isArray(value)) {
        //     value.forEach((v, i) => parseWidgetParam(v, i));
        // } else {
        parseWidgetParam(value)
        // };
      })
    } else {
      console.error(
        `The state template with name "${stateName}" doesn't exist. Skipping state updating...`
      )
    }

    return state
  }
} // class State
