/*
  It's a sandbox iframe where we create WebWorkers with remote code to run
  dapplets in secured and thread-isolated environment.
  Sandbox is injected into every context web page as an iframe.
  We use sandbox iframe because some web pages (e.g. github.com) have CSP that
  doesn't allow to create WebWorkers.
  It's pretty simple piece of code that just creates WebWorker and forwards
  messages from the content script to a dapplet's worker.
  Probably in the future versions of the extension we move it into a separate
  offscreen window provided by chrome.offscreen API.
*/

import { SandboxInitializationParams } from '../common/types'

const _workers = new Map<string, Worker>()

// Subscribe to messages from the content script
window.addEventListener('message', (event) => {
  const { method, params } = event.data

  switch (method) {
    case 'createWorker':
      createWorker(params[0], params[1], params[2], params[3])
      break
    case 'terminateWorker':
      terminateWorker(params[0])
      break
    case 'postMessageToWorker':
      postMessageToWorker(params[0], params[1])
      break
    // ToDo: destroy sandbox iframe
    default:
      break
  }
})

function createWorker(
  workerId: string,
  workerScriptUrl: string,
  dappletScript: string,
  injectorParams: SandboxInitializationParams
) {
  const serializedParams = JSON.stringify(injectorParams)

  // ToDo: isolate global.postMessage and global.addEventListener
  // ToDo: remove self.chrome when we will patch near-api-js correctly
  const concatedScript = `
    self.chrome={runtime:{id:'id'}};
    importScripts("${workerScriptUrl}");
    self.initialize(${serializedParams});
    ${dappletScript}
  `

  const dataUri = URL.createObjectURL(new Blob([concatedScript]))
  const worker = new Worker(dataUri, { name: injectorParams.manifest.name })

  worker.addEventListener('message', (event) => {
    window.top.postMessage(
      {
        method: 'postMessageFromWorker',
        params: [workerId, event.data],
      },
      '*'
    )
  })

  _workers.set(workerId, worker)
}

function terminateWorker(workerId: string) {
  const worker = _workers.get(workerId)
  if (worker) {
    worker.terminate()
    _workers.delete(workerId)
  }
  // ToDo: revokeObjectURL
}

function postMessageToWorker(workerId: string, message: any) {
  const worker = _workers.get(workerId)
  if (worker) {
    worker.postMessage(message)
  }
}
