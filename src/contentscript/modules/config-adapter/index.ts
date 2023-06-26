import { objectMap } from '../../../common/helpers'
import { DynamicAdapter } from '../dynamic-adapter'
import { ParserConfig } from './types'
import { AvatarBadge, IAvatarBadgeState } from './widgets/avatar-badge'
import { Button, IButtonProps } from './widgets/button'

class ConfigAdapter {
  public exports

  constructor(private _dynamicAdapter: DynamicAdapter<any>, config: ParserConfig) {
    this.exports = {
      button: _dynamicAdapter.createWidgetFactory<IButtonProps>(Button),
      avatarBadge: _dynamicAdapter.createWidgetFactory<IAvatarBadgeState>(AvatarBadge),
    }

    const adapterConfig = ConfigAdapter.convertParserConfig(config)
    _dynamicAdapter.configure(adapterConfig)
  }

  public attachConfig(config: any) {
    // ToDo: automate two-way dependency handling(?)
    return this._dynamicAdapter.attachConfig(config)
  }

  // ToDo: refactor it
  public detachConfig(config: any): void {
    this._dynamicAdapter.detachConfig(config)
  }

  public resetConfig(config: any, newConfig?: any): void {
    this._dynamicAdapter.resetConfig(config, newConfig ?? config)
  }

  public static convertParserConfig(parserConfig: ParserConfig) {
    const config = {}

    const getTheme = () => {
      for (const theme in parserConfig.themes ?? {}) {
        const result = document.evaluate(parserConfig.themes[theme], document)
        if (result.booleanValue === true) return theme
      }

      // ToDo: get default theme from css
      return 'LIGHT'
    }

    for (const contextName in parserConfig.contexts) {
      const ctx = parserConfig.contexts[contextName]

      // ToDo: add query type in parser config
      const query = (cssOrXPath: string, element: HTMLElement) => {
        try {
          const result = element.querySelector(cssOrXPath)
          if (result) return result.textContent
        } catch (_) {}

        try {
          const result = document.evaluate(cssOrXPath, element)

          switch (result.resultType) {
            case XPathResult.NUMBER_TYPE:
              return result.numberValue
            case XPathResult.STRING_TYPE:
              return result.stringValue
            case XPathResult.BOOLEAN_TYPE:
              return result.booleanValue
            default:
              return null // ToDo: or undefined?
          }
        } catch (_) {}

        return null
      }

      const events = objectMap(ctx.events ?? {}, (event) => {
        return (node, ctx, emit) => {
          const likeBtn = node.querySelector(event.element)
          likeBtn?.addEventListener(event.listen, () => {
            const data = event.data
              ? objectMap(event.data, (selector) => query(selector, node))
              : null

            emit(ctx, data)
          })
        }
      })

      const contextBuilder = (el: HTMLElement) => {
        const context = objectMap(ctx.contextBuilder ?? {}, (value) => {
          if (typeof value === 'string') {
            return query(value, el)
          } else {
            // ToDo: implement nested contexts when we stabilize the Parser Config Schema
            throw new Error('Nested contexts are not supported yet')
          }
        })

        return context
      }

      config[contextName] = {
        containerSelector: ctx.containerSelector,
        contextSelector: ctx.contextSelector,
        insPoints: ctx.insPoints,
        contextBuilder: contextBuilder,
        events: events,
        theme: getTheme,
        childrenContexts: ctx.childrenContexts,
      }
    }

    return config
  }
}

export { ConfigAdapter }
