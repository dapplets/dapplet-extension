import { IFeature } from '../../../types'
import { ButtonWidget, LabelWidget } from './classesWidget'
import { ButtonProps,Context,Exports, IButtonWidgetState, ILabelWidgetState, IWidget, IWidgetBuilderConfig, WidgetConfig } from './types'
import { WidgetBuilder } from './widgetBildet'

export class State<T> {
    public  INITIAL_STATE
    public _currentStateName = undefined
    public state: T
    private _cache: any = {}
    public changedHandler: (newValues: Partial<T>) => void
    public id: string
  
    constructor(
      private config: WidgetConfig<T>,
      public readonly ctx: any,
      private getTheme: () => string
    ) {
      const me = this
      this.id = config.id
      this.INITIAL_STATE =  config.initial || me._currentStateName || 'DEFAULT'
      this.state = new Proxy(
        {},
        {
          get(target, property, receiver) {
            if (property === 'state') return me._currentStateName
            if (property === 'ctx') return me.config
            if (property === 'setState') return me.setState.bind(me)
            if (property === 'id') return me.id
            if (property === 'theme') return me.getTheme?.()
         
  
            const theme = me.getTheme?.()
  
            const value = me._currentStateName
              ? me._cache[me._currentStateName][property]
              : me._cache[property]
            
  
            if (theme) {
              return typeof value === 'object' && value?.[theme] ? value[theme] : value
            } else {
              return value
            }
            
          },
          set(target, property, value, receiver) {
  
            if (property === 'state') {
              me.setState(value)
            } else if (property === 'newState') {
              me.setState(value, true)
            } else {
              const valueOrObservable = me.config[me._currentStateName][property] = value
              me._cache[me._currentStateName][property] = value
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
              me.changedHandler && me.changedHandler(me._themifyState({ [property]: value }))
  
            }
            return true
          },
        }
      ) as T
      if (me.config[me.config.initial]){
         me.setState(me.config.initial)
        }
    }
  
    public setState(stateName: string, resetState = false): any {
      do {
        if (stateName == this._currentStateName) {
          //console.log(`NOP state transition "${stateName}". Skipping...`)
          break
        } else if (!this._cache[stateName] || resetState) {
          this._cache[stateName] = this.createNewStateFromConfig(stateName)
          
        }
        this._currentStateName = stateName
        stateName = this._cache[stateName].NEXT
        
      } while (stateName)
    this.INITIAL_STATE = this._currentStateName
    this.config.initial = this._currentStateName
    
    this.changedHandler && this.changedHandler(this.getStateValues())
      return this._cache[this._currentStateName]
    }
  
    public getStateValues(): T {
      const cachedState = this._currentStateName ? this._cache[this._currentStateName] : this._cache
      return this._themifyState(cachedState)
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
            // console.log(valueOrApConf,'valueOrApConf');
            
            if (isObservable(valueOrApConf)) {
              if (i === undefined) {
                state[key] = valueOrApConf.value
                valueOrApConf.subscribe((v) => {
                  // ToDo: potential bug
                  if (stateName == me._currentStateName) {
                    state[key] = v
                    me.changedHandler && me.changedHandler(me._themifyState({ [key]: v }))
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
                    me.changedHandler && me.changedHandler(me._themifyState({ [key]: v }))
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
  
    private _themifyState(values: any): any {
      const theme = this.getTheme?.()
      if (!theme) return values
      const themedEntries = Object.entries(values).map(([k, v]) => [
        k,
        typeof v === 'object' && v?.[theme] ? v[theme] : v,
      ])
      const themedState = Object.fromEntries(themedEntries)
      console.log({ ...themedState, theme });
      return { ...themedState, theme }
    }
  } // class State