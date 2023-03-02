import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
import { IConnectedAccountUser } from '../../../../../../../../common/types'

const askIfSameRequestsExist = async (accounts: [IConnectedAccountUser, IConnectedAccountUser]) => {
  const [firstAccount, secondAccount] = accounts
  const firstAccountGlobalId = firstAccount.name + '/' + firstAccount.origin
  const secondAccountGlobalId = secondAccount.name + '/' + secondAccount.origin
  const { getConnectedAccountsPendingRequests, getConnectedAccountsVerificationRequest } =
    await initBGFunctions(browser)
  const a = await getConnectedAccountsPendingRequests()
  for (let i = 0; i < a.length; i++) {
    const b: { firstAccount: string; secondAccount: string } =
      await getConnectedAccountsVerificationRequest(a[i])
    const first = b.firstAccount
    const second = b.secondAccount
    const res =
      (first === firstAccountGlobalId && second === secondAccountGlobalId) ||
      (first === secondAccountGlobalId && second === firstAccountGlobalId)
    return res
  }
  return false
}

export default askIfSameRequestsExist
