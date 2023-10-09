import { objectMap } from '../../../common/helpers'
import { ParserConfig } from '../../../common/types'
import { DynamicAdapter } from '../dynamic-adapter'
import { AdapterConfig, DappletConfig } from '../dynamic-adapter/types'
import BuiltInWidgets from './widgets'

type ReversedWidgetConfig = {
  [widgetName: string]: {
    contextInsPoints: { [contextName: string]: string }
    stylesByInsPoint: { [insPointName: string]: string | null }
  }
}

class ConfigAdapter {
  public exports

  constructor(
    private _adapterName: string,
    private _dynamicAdapter: DynamicAdapter,
    parserConfig: ParserConfig
  ) {
    // ToDo: validate parser config

    // Original parser config has the following hierarchy: context -> widget
    // We need to reverse it to widget -> context for convenience
    const reversedWidgetConfig = ConfigAdapter.reverseWidgetConfig(parserConfig)

    this.exports = this.createWidgetFactories(reversedWidgetConfig)

    const adapterConfig = ConfigAdapter.convertParserConfig(parserConfig)
    _dynamicAdapter.configure(adapterConfig, this._adapterName)
  }

  // Config from dapplet
  public attachConfig(config: DappletConfig) {
    // ToDo: automate two-way dependency handling(?)
    return this._dynamicAdapter.attachConfig(config, this._adapterName)
  }

  // ToDo: refactor it
  // Config from dapplet
  public detachConfig(config: DappletConfig): void {
    this._dynamicAdapter.detachConfig(config)
  }

  // Config from dapplet
  public resetConfig(config: DappletConfig, newConfig?: DappletConfig): void {
    this._dynamicAdapter.resetConfig(config, newConfig ?? config, this._adapterName)
  }

  public static convertParserConfig(parserConfig: ParserConfig) {
    const config: AdapterConfig = {}

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

      const insPoints = {}

      // ToDo: remove after transition to MV3
      // define insertion points for backward compatibility
      for (const widgetName in ctx.widgets ?? {}) {
        const widgetConfig = ctx.widgets[widgetName]

        insPoints[`${contextName}/${widgetName}`] = {
          selector: widgetConfig.insertionPoint,
          insert: widgetConfig.insert,
        }

        // ToDo: refactor it after merging of NEAR BOS
        // These insertion points are defined in Parser Configs
        // and were introduced at Encode x NEAR Horizon Hackathon
        for (const insPointName in widgetConfig.insertionPoints ?? {}) {
          const insPoint = widgetConfig.insertionPoints[insPointName]
          insPoints[`${contextName}/${widgetName}/${insPointName}`] = {
            selector: insPoint.selector,
            insert: insPoint.insert,
            wrapper: insPoint.wrapper, // Container that wraps child widgets
          }
        }
      }

      config[contextName] = {
        containerSelector: ctx.containerSelector,
        contextSelector: ctx.contextSelector,
        insPoints: insPoints,
        contextBuilder: contextBuilder,
        events: events,
        theme: getTheme,
        childrenContexts: ctx.childrenContexts,
      }
    }

    return config
  }

  public static reverseWidgetConfig(parserConfig: ParserConfig): ReversedWidgetConfig {
    const widgetConfigs: ReversedWidgetConfig = {}

    for (const contextName in parserConfig.contexts ?? {}) {
      for (const widgetName in parserConfig.contexts[contextName].widgets ?? {}) {
        const widgetConfig = parserConfig.contexts[contextName].widgets[widgetName]

        if (!widgetConfigs[widgetName]) {
          widgetConfigs[widgetName] = {
            contextInsPoints: {},
            stylesByInsPoint: {},
          }
        }

        // ToDo: remove after transition to MV3
        // For backward compatibility with old configs
        // Insertion point name example: 'POST/button'
        const insPointName = `${contextName}/${widgetName}`
        widgetConfigs[widgetName].contextInsPoints[contextName] = insPointName
        widgetConfigs[widgetName].stylesByInsPoint[insPointName] = widgetConfig.styles

        // ToDo: unify insertion points for BOS components and built-in widgets
        // The line below allows to inject BOS components into any insertion points
        // defined in a Parser Config. It was added at Encode x NEAR Horizon Hackathon
        for (const insPoint in widgetConfig.insertionPoints) {
          const fullInsPointName = `${insPointName}/${insPoint}`
          const insPointConfig = widgetConfig.insertionPoints[insPoint]
          widgetConfigs[widgetName].stylesByInsPoint[fullInsPointName] = insPointConfig.styles
        }
      }
    }

    return widgetConfigs
  }

  public createWidgetFactories(reversedWidgetConfig: ReversedWidgetConfig) {
    const exports = {}

    for (const widgetName in reversedWidgetConfig) {
      if (!BuiltInWidgets[widgetName]) {
        console.error('Unknown widget: ' + widgetName)
        continue
      }

      const widgetConfig = reversedWidgetConfig[widgetName]

      const WidgetClass = BuiltInWidgets[widgetName]

      const ExtendedWidgetClass = class extends WidgetClass {
        // ToDo: remove after transition to MV3
        static contextInsPoints = Object.assign({}, widgetConfig.contextInsPoints)
        static stylesByInsPoint = widgetConfig.stylesByInsPoint
      }

      exports[widgetName] = this._dynamicAdapter.createWidgetFactory(ExtendedWidgetClass)
    }

    return exports
  }
}

export { ConfigAdapter }
