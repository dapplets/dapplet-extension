import { Subject } from 'rxjs'
import { JsonRpc } from '../common/jsonrpc'
import { SandboxInitializationParams } from '../common/types'
import { Core } from './core'
import { AppStorage } from './core/appStorage'
import ConnectedAccounts from './core/connectedAccounts'
import { BaseEvent } from './core/events/baseEvent'
import { EventBus } from './core/events/eventBus'
import { Injector } from './injector'
import { OverlayManagerIframe } from './overlay/overlayManager'

function initialize(params: SandboxInitializationParams) {
  const eventStream = new Subject<BaseEvent>()
  const moduleEventBus = new EventBus(eventStream)
  const jsonrpc = new JsonRpc()
  const overlayManager = new OverlayManagerIframe(jsonrpc)
  const connectedAccounts = new ConnectedAccounts()
  const storage = new AppStorage(params.manifest, params.defaultConfig, params.schemaConfig)
  const core = new Core(
    params.manifest,
    connectedAccounts,
    storage,
    overlayManager,
    params.env,
    moduleEventBus
  )
  const injector = new Injector(core)

  const globalMessageHandler = ({ data }: MessageEvent) => {
    const { id, method, params } = data

    switch (method) {
      case 'activate':
        injector
          .activate()
          .then((result) => global.postMessage({ id, result }))
          .catch((error) => {
            global.postMessage({ id, error })
          })
        break
      case 'deactivate':
        injector
          .deactivate()
          .then(() => {
            global.postMessage({ id })
            global.removeEventListener('message', globalMessageHandler)
          })
          .catch((error) => {
            global.postMessage({ id, error })
          })
        break
      case 'fireActionEvent':
        core.actionListener?.()
        break
      case 'fireHomeEvent':
        core.homeListener?.()
        break
      case 'fireWalletsUpdateEvent':
        core.walletsUpdateListener?.()
        break
      case 'fireConnectedAccountsUpdateEvent':
        core.connectedAccountsUpdateListener?.()
        break
      case 'fireEventBus':
        eventStream.next(params[0]) // ToDo: add types?
        break
      default:
        // ToDo: move all handlers to here
        // console.error(`[Sandbox] Unknown method: ${method}`)
        break
    }
  }

  global.addEventListener('message', globalMessageHandler)

  // Register global variables for executing modules in the sandbox
  global.Core = core
  global.Injectable = injector.injectableDecorator.bind(injector)
  global.Inject = injector.injectDecorator.bind(injector)
  global.OnEvent = injector.onEventDecorator.bind(injector)
  global.exports = {} // for CommonJS modules compatibility
}

global.initialize = initialize
