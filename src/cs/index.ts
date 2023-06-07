import { upgradeElement } from '@ampproject/worker-dom/dist/debug/main.mjs'
import browser from 'webextension-polyfill'

async function init() {
  document.documentElement.setAttribute('src', browser.runtime.getURL('sandbox.js'))

  // const iframe = document.createElement('iframe')
  // iframe.src = browser.runtime.getURL('sandbox.html')
  // document.body.appendChild(iframe)

  // browser.offscreen.closeDocument()

  const worker = await upgradeElement(
    document.documentElement,
    browser.runtime.getURL('worker.mjs')
  )

  console.log('worker', worker)
}

if (window.document.body) {
  init()
} else {
  window.addEventListener('DOMContentLoaded', () => init())
}
