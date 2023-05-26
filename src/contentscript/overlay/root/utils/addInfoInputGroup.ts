import { initBGFunctions } from 'chrome-extension-message-wrapper'
import browser from 'webextension-polyfill'
import { regExpIndexEthereum } from '../common/constants'
import { getValidationAddress } from '../common/helpers'

export const _addInfoItemInputGroup = async (
  value: string,
  setEditLoading,
  setAddDisabled,
  containsValue,
  arr,
  setDisabledAdd,
  targetRegistry,
  mi,
  setVisible,
  nodeBtn,
  setInput,
  parameters
) => {
  setEditLoading(true)
  setAddDisabled(true)
  const valueParse = getValidationAddress(value, regExpIndexEthereum)
  const validValue = containsValue(arr, value)
  if (validValue || (parameters === 'admins' && valueParse === null)) {
    setDisabledAdd(true)
    setEditLoading(false)
    setAddDisabled(false)
    setTimeout(() => {
      setDisabledAdd(false)
    }, 1000)
  } else {
    try {
      if (parameters === 'contextId') {
        const { addContextId } = await initBGFunctions(browser)
        await addContextId(targetRegistry, mi.name, value)
      } else {
        const { addAdmin } = await initBGFunctions(browser)
        await addAdmin(targetRegistry, mi.name, value)
      }

      setVisible(true)
      setEditLoading(false)
      setAddDisabled(false)
      nodeBtn.current?.classList.remove('valid')
      setInput('')
    } catch (error) {
      setVisible(false)
      setEditLoading(false)
      setAddDisabled(false)
      nodeBtn.current?.classList.remove('valid')
    }
  }
}
