import { Injector } from './injector'

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
// ToDo: add global.Core
global.Injectable = injector.injectableDecorator.bind(injector)
global.Inject = injector.injectDecorator.bind(injector)
global.exports = {} // for CommonJS modules compatibility
