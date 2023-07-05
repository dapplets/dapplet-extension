import browser from 'webextension-polyfill'
import { blobToDataURL } from '../common/helpers'
import NFT_NO_ICON from '../common/resources/nft-no-icon.svg'
import NFT_TEMPLATE from '../common/resources/nft-template.svg'

browser.runtime.onMessage.addListener(handleMessages)

async function handleMessages(message: { target: string; type: string; data: string; id: string }) {
  if (message.target !== 'offscreen') return false

  switch (message.type) {
    case 'generate-nft-image':
      generateNftImage(message.data, message.id)
      break
    default:
      console.warn(`Unexpected message type received: '${message.type}'.`)
      return false
  }
}

async function generateNftImage(data: string, id: string) {
  if (!data) return
  const { name, title, icon } = JSON.parse(data)
  const iconAsBlob = icon ? await fetch(icon).then((res) => res.blob()) : null
  const base64ImageToCanvas = (base64: string): Promise<HTMLCanvasElement> =>
    new Promise((res, rej) => {
      const image = new Image()
      image.src = base64
      image.onerror = function (msg) {
        rej(msg)
      }
      image.onload = function () {
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0)
        res(canvas)
      }
    })

  const wrapper = document.createElement('svg')
  wrapper.innerHTML = atob(NFT_TEMPLATE.split(',')[1])
  const svg = wrapper.firstElementChild
  const titleEl = svg.querySelector('#module-title')
  const nameEl = svg.querySelector('#module-name')

  titleEl.innerHTML = title
  nameEl.innerHTML = name

  const dataUrlUnknownMime = iconAsBlob ? await blobToDataURL(new Blob([iconAsBlob])) : NFT_NO_ICON
  const iconCanvas = await base64ImageToCanvas(dataUrlUnknownMime)
  const dataUrl = iconCanvas.toDataURL()

  const iconEl = svg.querySelector('#module-icon')
  iconEl.setAttribute('xlink:href', dataUrl)

  const svgData = new XMLSerializer().serializeToString(svg)
  const svgAsBase64 = 'data:image/svg+xml;base64,' + btoa(svgData)

  const imageCanvas = await base64ImageToCanvas(svgAsBase64)
  const blob: Blob = await new Promise((r) => imageCanvas.toBlob(r))
  const result = await blobToDataURL(blob)
  sendToBackground('add-nft-image-result', id, result)
}

function sendToBackground(type: string, id: string, data: string) {
  browser.runtime.sendMessage({
    type,
    target: 'offscreen-service',
    data,
    id,
  })
}
