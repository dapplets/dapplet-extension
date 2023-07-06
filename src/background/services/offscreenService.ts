// import browser from 'webextension-polyfill' // ToDo: chrome.offscreen is not supported by webextension-polyfill@0.10.0. Need to be updated when it will.
import { blobToDataURL, generateGuid } from '../../common/helpers'

const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html'

export const generateNftImage = async ({
  name,
  title,
  icon,
}: {
  name: string
  title: string
  icon?: Blob
}): Promise<Blob> => {
  const iconToSend = icon && (await blobToDataURL(icon))
  const dataToSend = JSON.stringify({ name, title, icon: iconToSend })
  if (!(await chrome.offscreen.hasDocument())) {
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH),
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Parse DOM',
    })
  }
  const requestId = generateGuid()
  chrome.runtime.sendMessage({
    type: 'generate-nft-image',
    target: 'offscreen',
    data: dataToSend,
    id: requestId,
  })

  return new Promise((res) => {
    const addNftImageResultListener = async (message: {
      target: string
      type: string
      data: string
      id: string
    }) => {
      if (
        message.target !== 'offscreen-service' ||
        message.type !== 'add-nft-image-result' ||
        message.id !== requestId
      ) {
        return
      }
      res(fetch(message.data).then((res) => res.blob()))
      await closeOffscreenDocument()
      chrome.runtime.onMessage.removeListener(addNftImageResultListener)
    }
    chrome.runtime.onMessage.addListener(addNftImageResultListener)
  })
}

async function closeOffscreenDocument() {
  if (!(await chrome.offscreen.hasDocument())) {
    return
  }
  chrome.offscreen.closeDocument()
}
