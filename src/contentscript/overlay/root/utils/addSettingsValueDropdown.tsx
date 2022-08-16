import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
import {
  regExpIndexENS,
  regExpIndexEthereum,
  regExpIndexNear,
  regExpIndexNEARDev,
  regExpIndexNEARImplicit,
  regExpIndexNearTestnet,
} from '../common/constants'
import { getValidationAddress } from '../common/helpers'
export const addSettingsValueDropdown = async (
  value: string,
  parameter,
  inputValue,
  setInputError,
  setInput,
  loadInput,
  func: () => void
) => {
  const valueParse = getValidationAddress(inputValue, regExpIndexEthereum)
  const valueParseNEARImplicit = getValidationAddress(inputValue, regExpIndexNEARImplicit)
  const valueParseNEARDev = getValidationAddress(inputValue, regExpIndexNEARDev)
  const valueParseENS = getValidationAddress(inputValue, regExpIndexENS)
  const valueParseNear = getValidationAddress(inputValue, regExpIndexNear)
  const valueParseNearTestnet = getValidationAddress(inputValue, regExpIndexNearTestnet)
  if (
    valueParse !== null ||
    valueParseNEARImplicit !== null ||
    valueParseNEARDev !== null ||
    valueParseENS !== null ||
    valueParseNear !== null ||
    valueParseNearTestnet !== null
  ) {
    try {
      if (parameter === 'registry') {
        const { addRegistry } = await initBGFunctions(browser)
        await addRegistry(value, false)
      } else {
        const { addTrustedUser } = await initBGFunctions(browser)
        await addTrustedUser(value)
      }

      setInput(inputValue)
      setInputError(null)
    } catch (err) {
      setInputError(err.message)
    }

    loadInput()
    func()
  } else {
    if (parameter === 'registry') {
      setInputError('Enter valid Registry')
    } else {
      setInputError('Enter valid Trusted User')
    }
  }
}
