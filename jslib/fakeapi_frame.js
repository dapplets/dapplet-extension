const browser = {}

browser.tabs = {}
browser.runtime = {}

browser.runtime.sendMessage = async function (message, callback) {
  //console.log('browser.runtime.sendMessage', arguments);
  return sendMessage(message, callback)
}
browser.tabs.sendMessage = async function (tabId, message, callback) {
  //console.log('browser.tabs.sendMessage', arguments);
  return sendMessage(message, callback)
}

function randomHex(len) {
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map((x) => x.toString(16))
    .join('')
}

async function sendMessage(message, callback) {
  return new Promise((res, rej) => {
    const id = randomHex(8)

    const handler = (event) => {
      try {
        const payload =
          typeof event.data === 'string'
            ? JSON.parse(event.data)
            : typeof event.data.message === 'string'
            ? JSON.parse(event.data.message)
            : null

        if (
          !!payload &&
          payload.id === id &&
          (payload.response !== undefined || payload.request === undefined)
        ) {
          window.removeEventListener('message', handler)
          callback !== undefined && typeof callback === 'function' && callback(payload.response)
          res(payload.response)
        }
      } catch (err) {}
    }

    window.addEventListener('message', handler)

    window.top.postMessage(
      JSON.stringify({
        request: message,
        id: id,
      }),
      '*'
    )
  })
}

Object.defineProperty(window, 'browser', { value: browser })
Object.defineProperty(window, 'DAPPLETS_JSLIB', { value: true })
