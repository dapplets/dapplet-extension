import browser from 'webextension-polyfill'
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
  if (!(await browser.offscreen.hasDocument())) {
    await browser.offscreen.createDocument({
      url: browser.runtime.getURL('') + OFFSCREEN_DOCUMENT_PATH,
      reasons: [browser.offscreen.Reason.DOM_PARSER],
      justification: 'Parse DOM',
    })
  }
  const requestId = generateGuid()
  browser.runtime.sendMessage({
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
      browser.runtime.onMessage.removeListener(addNftImageResultListener)
    }
    browser.runtime.onMessage.addListener(addNftImageResultListener)
  })
}

async function closeOffscreenDocument() {
  if (!(await browser.offscreen.hasDocument())) {
    return
  }
  browser.offscreen.closeDocument()
}
