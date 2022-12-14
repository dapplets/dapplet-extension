import { initBGFunctions } from 'chrome-extension-message-wrapper'
import makeBlockie from 'ethereum-blockies-base64'
import { browser } from 'webextension-polyfill-ts'
import { resources } from '../../common/resources'
import { socialNetworkConnectionCondition } from './connected-accounts-assembly'
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
    if (!resources[firstOriginId] || !resources[secondOriginId]) {
      throw new Error(`Unsupported account type: ${firstOriginId} or ${secondOriginId}`)
    }
    const canConnect = socialNetworkConnectionCondition(
      resources[firstOriginId].type === 'social'
        ? {
            socNet_id: firstAccountId,
            url: firstProofUrl,
            near_id: secondAccountId,
            fullname: condition['user'],
          }
        : {
            socNet_id: secondAccountId,
            url: secondProofUrl,
            near_id: firstAccountId,
            fullname: condition['user'],
          }
    )

    const firstAccountStatus = await this.getStatus(firstAccountId, firstOriginId)
    const secondAccountStatus = await this.getStatus(secondAccountId, secondOriginId)

    const { openConnectedAccountsPopup, getThisTab } = await initBGFunctions(browser)
    const thisTab = await getThisTab()
    const { requestId } = await openConnectedAccountsPopup(
      {
        [isUnlink ? 'accountsToDisconnect' : 'accountsToConnect']: [
          {
            name: firstAccountId,
            origin: firstOriginId,
            img: firstAccountImage ? firstAccountImage : makeBlockie(firstAccountId),
            accountActive: firstAccountStatus,
          },
          {
            name: secondAccountId,
            origin: secondOriginId,
            img: secondAccountImage ? secondAccountImage : makeBlockie(secondAccountId),
            accountActive: secondAccountStatus,
          },
        ],
        condition: !canConnect,
      },
      thisTab.id
    )
    return canConnect ? requestId : -1
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
