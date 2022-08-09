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
    const { getMinStakeAmount } = await initBGFunctions(browser)
    return getMinStakeAmount()
  }

  public async getPendingRequests(): Promise<number[]> {
    const { getPendingRequests } = await initBGFunctions(browser)
    return getPendingRequests()
  }

  public async getVerificationRequest(id: number): Promise<VerificationRequest | null> {
    const { getVerificationRequest } = await initBGFunctions(browser)
    return getVerificationRequest(id)
  }

  public async getStatus(accountId: string, originId: string): Promise<boolean> {
    const { getStatus } = await initBGFunctions(browser)
    return getStatus(accountId, originId)
  }

  public async getMainAccount(accountId: string, originId: string): Promise<string | null> {
    const { getMainAccount } = await initBGFunctions(browser)
    return getMainAccount(accountId, originId)
  }

  public async getRequestStatus(
    id: number
  ): Promise<'not found' | 'pending' | 'approved' | 'rejected'> {
    const { getRequestStatus } = await initBGFunctions(browser)
    return getRequestStatus(id)
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
    switch (condition.type) {
      case 'twitter/near-testnet':
        if (firstOriginId === 'near/testnet' && secondOriginId === 'twitter') {
          canConnect = connectionCondition({
            tw_id: secondAccountId,
            url: secondProofUrl,
            near_id: firstAccountId,
            user: condition['user'],
          })
        } else if (secondOriginId === 'near/testnet' && firstOriginId === 'twitter') {
          canConnect = connectionCondition({
            tw_id: firstAccountId,
            url: firstProofUrl,
            near_id: secondAccountId,
            user: condition['user'],
          })
        } else {
          throw new Error('Connection conditions not met')
        }
        break
      default:
        throw new Error('Connection conditions not met')
    }

    if (canConnect) {
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
    } else {
      throw new Error('Connection conditions not met')
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
