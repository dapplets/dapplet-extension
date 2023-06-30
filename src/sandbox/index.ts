import { SandboxInitializationParams } from '../common/types'
import { Core } from './core'
import { AppStorage } from './core/appStorage'
import ConnectedAccounts from './core/connectedAccounts'
import { Injector } from './injector'

function initialize(params: SandboxInitializationParams) {
  const connectedAccounts = new ConnectedAccounts()
  const storage = new AppStorage(params.manifest, params.defaultConfig, params.schemaConfig)
  const core = new Core(connectedAccounts, storage)
  const injector = new Injector()

  const globalMessageHandler = ({ data }: MessageEvent) => {
    const { id, method } = data

    switch (method) {
      case 'activate':
        injector
          .activate()
          .then(() => global.postMessage({ id }))
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
      default:
        // ToDo: move all handlers to here
        // console.error(`[Sandbox] Unknown method: ${method}`)
        break
    }
  }

  global.addEventListener('message', globalMessageHandler)

  // Register global variables for executing modules in the sandbox
  global.Core = core as any // ToDo: remove any when Core will be implemented completely
  global.Injectable = injector.injectableDecorator.bind(injector)
  global.Inject = injector.injectDecorator.bind(injector)
  global.exports = {} // for CommonJS modules compatibility
}

global.initialize = initialize
