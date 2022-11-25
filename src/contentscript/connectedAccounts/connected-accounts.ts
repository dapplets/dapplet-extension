import { initBGFunctions } from 'chrome-extension-message-wrapper'
import makeBlockie from 'ethereum-blockies-base64'
import { browser } from 'webextension-polyfill-ts'
import { connectionCondition } from './connected-accounts-assembly'
import { Account, VerificationRequest } from './types'

interface IRequestVerificationProps {
  firstAccountId: string
  firstOriginId: string
  firstAccountImage: string
  secondAccountId: string
  secondOriginId: string
  secondAccountImage: string
  isUnlink: boolean
  firstProofUrl?: string
  secondProofUrl?: string
}

class ConnectedAccounts {
  // ***** VIEW *****

  public async getConnectedAccounts(
    accountId: string,
    originId: string,
    closeness?: number
  ): Promise<Account[][] | null> {
    const { getConnectedAccounts } = await initBGFunctions(browser)
    return getConnectedAccounts(accountId, originId, closeness)
  }

  public async getMinStakeAmount(): Promise<number> {
    const { getConnectedAccountsMinStakeAmount } = await initBGFunctions(browser)
    return getConnectedAccountsMinStakeAmount()
  }

  public async getPendingRequests(): Promise<number[]> {
    const { getConnectedAccountsPendingRequests } = await initBGFunctions(browser)
    return getConnectedAccountsPendingRequests()
  }

  public async getVerificationRequest(id: number): Promise<VerificationRequest | null> {
    const { getConnectedAccountsVerificationRequest } = await initBGFunctions(browser)
    return getConnectedAccountsVerificationRequest(id)
  }

  public async getStatus(accountId: string, originId: string): Promise<boolean> {
    const { getConnectedAccountStatus } = await initBGFunctions(browser)
    return getConnectedAccountStatus(accountId, originId)
  }

  public async getMainAccount(accountId: string, originId: string): Promise<string | null> {
    const { getConnectedAccountsMainAccount } = await initBGFunctions(browser)
    return getConnectedAccountsMainAccount(accountId, originId)
  }

  public async getRequestStatus(
    id: number
  ): Promise<'not found' | 'pending' | 'approved' | 'rejected'> {
    const { getConnectedAccountsRequestStatus } = await initBGFunctions(browser)
    return getConnectedAccountsRequestStatus(id)
  }

  // ***** CALL *****

  public async requestVerification(
    {
      firstAccountId,
      firstOriginId,
      firstAccountImage,
      secondAccountId,
      secondOriginId,
      secondAccountImage,
      firstProofUrl,
      secondProofUrl,
      isUnlink,
    }: IRequestVerificationProps,
    condition: {
      type: string
      [name: string]: string
    }
  ): Promise<number> {
    let canConnect: boolean
    if (condition.type === 'twitter/near-testnet' || condition.type === 'github/near-testnet') {
      if (
        firstOriginId === 'near/testnet' &&
        (secondOriginId === 'twitter' || secondOriginId === 'github')
      ) {
        canConnect = connectionCondition({
          socNet_id: secondAccountId,
          url: secondProofUrl,
          near_id: firstAccountId,
          user: condition['user'],
        })
      } else if (
        secondOriginId === 'near/testnet' &&
        (firstOriginId === 'twitter' || firstOriginId === 'github')
      ) {
        canConnect = connectionCondition({
          socNet_id: firstAccountId,
          url: firstProofUrl,
          near_id: secondAccountId,
          user: condition['user'],
        })
      } else {
        throw new Error(
          `Incorrect origins for ${condition.type} type connection condition: ${firstOriginId} or ${secondOriginId}.`
        )
      }
    }

    if (!canConnect) {
      const { openConnectedAccountsPopup, getThisTab } = await initBGFunctions(browser)
      const thisTab = await getThisTab()
      await openConnectedAccountsPopup(
        {
          condition: true,
        },
        thisTab.id
      )
      return -1
    } else {
      const { openConnectedAccountsPopup, getThisTab } = await initBGFunctions(browser)
      const thisTab = await getThisTab()
      const { requestId } = await openConnectedAccountsPopup(
        {
          [isUnlink ? 'accountsToDisconnect' : 'accountsToConnect']: [
            {
              name: firstAccountId,
              origin: firstOriginId,
              img: firstAccountImage ? firstAccountImage : makeBlockie(firstAccountId),
            },
            {
              name: secondAccountId,
              origin: secondOriginId,
              img: secondAccountImage ? secondAccountImage : makeBlockie(secondAccountId),
            },
          ],
        },
        thisTab.id
      )
      return requestId
    }
  }

  public async changeStatus({
    accountId,
    originId,
    accountImage,
    isMain,
  }: {
    accountId: string
    originId: string
    accountImage: string
    isMain: boolean
  }): Promise<void> {
    const { openConnectedAccountsPopup, getThisTab } = await initBGFunctions(browser)
    const thisTab = await getThisTab()
    const { requestId } = await openConnectedAccountsPopup(
      {
        accountToChangeStatus: {
          name: accountId,
          origin: originId,
          img: accountImage ? accountImage : makeBlockie(accountId),
          accountActive: isMain,
        },
      },
      thisTab.id
    )
    return requestId
  }
}

export default ConnectedAccounts
