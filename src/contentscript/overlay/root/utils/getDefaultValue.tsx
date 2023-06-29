import { initBGFunctions } from 'chrome-extension-message-wrapper'
import browser from 'webextension-polyfill'

export const getDefaultValueProvider = async (
  inputValue: string,
  providerUrl: string,
  setProvider: any
) => {
  const { getInitialConfig } = await initBGFunctions(browser)
  const config = await getInitialConfig()

  if (config[providerUrl] !== inputValue) {
    await setProvider(config[providerUrl])
  }
}
