import { initBGFunctions } from 'chrome-extension-message-wrapper'

export const getDefaultValueProvider = async (
  inputValue: string,
  providerUrl: string,
  setProvider: any
) => {
  const { getInitialConfig } = await initBGFunctions(chrome)
  const config = await getInitialConfig()

  if (config[providerUrl] !== inputValue) {
    await setProvider(config[providerUrl])
  }
}
