import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
import { IConnectedAccountUser, TConnectedAccount } from '../../../../../../../../common/types'

const checkIfTheAccountsHaveBeenAlreadyConnected = async (
  accounts: [IConnectedAccountUser, IConnectedAccountUser]
) => {
  const { getConnectedAccounts } = await initBGFunctions(browser)
  const accountFirstCA: TConnectedAccount[][] = await getConnectedAccounts(
    accounts[0].name,
    accounts[0].origin,
    1
  )
  const caGlobalNames = accountFirstCA[0].map((acc) => acc.id)
  const secondAccountGlobalId = accounts[1].name + '/' + accounts[1].origin
  return caGlobalNames.includes(secondAccountGlobalId)
}

export default checkIfTheAccountsHaveBeenAlreadyConnected
