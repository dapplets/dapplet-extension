import { initBGFunctions } from 'chrome-extension-message-wrapper'
import browser from 'webextension-polyfill'

export const _removeInfoItemInputGroup = async (
  value: string,
  setEditLoading,
  setAddDisabled,
  targetRegistry,
  mi,
  setVisible,
  nodeBtn,
  setInput,
  parameters,
  getParameters
) => {
  setEditLoading(true)
  setAddDisabled(true)
  try {
    if (parameters === 'contextId') {
      const { removeContextId } = await initBGFunctions(browser)
      await removeContextId(targetRegistry, mi.name, value)
    } else {
      const { removeAdmin } = await initBGFunctions(browser)
      await removeAdmin(targetRegistry, mi.name, value)
    }

    setInput('')
    await getParameters()
  } catch (error) {
  } finally {
    setAddDisabled(false)

    setEditLoading(false)
    setVisible(true)
    nodeBtn.current?.classList.remove('valid')
  }
}
