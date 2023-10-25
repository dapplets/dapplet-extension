import makeBlockie from 'ethereum-blockies-base64'
import { resources } from '../../common/resources'
import { TConnectedAccountsVerificationRequestInfo } from '../../common/types'
import { initBGFunctions } from '../communication'

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

interface ISocialNetworkConnectionCondition {
  socNet_id: string
  near_id: string
  url: string
  fullname: string
}

type AccountStatus = {
  isMain: boolean
}

type Account = {
  id: string
  status: AccountStatus
}

class ConnectedAccounts {
  // ***** VIEW *****

  public async getConnectedAccounts(
    accountId: string,
    originId: string,
    closeness?: number
  ): Promise<Account[][] | null> {
    const { getConnectedAccounts } = initBGFunctions()
    return getConnectedAccounts(accountId, originId, closeness)
  }

  public async getMinStakeAmount(): Promise<number> {
    const { getConnectedAccountsMinStakeAmount } = initBGFunctions()
    return getConnectedAccountsMinStakeAmount()
  }

  public async getPendingRequests(): Promise<number[]> {
    const { getConnectedAccountsPendingRequests } = initBGFunctions()
    return getConnectedAccountsPendingRequests()
  }

  public async getVerificationRequest(
    id: number
  ): Promise<TConnectedAccountsVerificationRequestInfo | null> {
    const { getConnectedAccountsVerificationRequest } = initBGFunctions()
    return getConnectedAccountsVerificationRequest(id)
  }

  public async getStatus(accountId: string, originId: string): Promise<boolean> {
    const { getConnectedAccountStatus } = initBGFunctions()
    return getConnectedAccountStatus(accountId, originId)
  }

  public async getMainAccount(accountId: string, originId: string): Promise<string | null> {
    const { getConnectedAccountsMainAccount } = initBGFunctions()
    return getConnectedAccountsMainAccount(accountId, originId)
  }

  public async getRequestStatus(
    id: number
  ): Promise<'not found' | 'pending' | 'approved' | 'rejected'> {
    const { getConnectedAccountsRequestStatus } = initBGFunctions()
    return getConnectedAccountsRequestStatus(id)
  }

  public async areConnected(accountGId1: string, accountGId2: string): Promise<boolean> {
    const { areConnectedAccounts } = initBGFunctions()
    return areConnectedAccounts(accountGId1, accountGId2)
  }

  public async getNet(accountGId: string): Promise<string[] | null> {
    const { getConnectedAccountsNet } = initBGFunctions()
    return getConnectedAccountsNet(accountGId)
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

    const { openConnectedAccountsPopup, getThisTab } = initBGFunctions()
    const thisTab = await getThisTab()
    const result = await openConnectedAccountsPopup(
      {
        [isUnlink ? 'accountsToDisconnect' : 'accountsToConnect']: [
          {
            name: firstAccountId,
            origin: firstOriginId,
            img: firstAccountImage
              ? firstAccountImage
              : firstAccountId && makeBlockie(firstAccountId),
            accountActive: firstAccountStatus,
          },
          {
            name: secondAccountId,
            origin: secondOriginId,
            img: secondAccountImage
              ? secondAccountImage
              : secondAccountId && makeBlockie(secondAccountId),
            accountActive: secondAccountStatus,
          },
        ],
        condition: {
          result: !canConnect,
          original: condition,
        },
      },
      thisTab.id
    )
    return canConnect && result ? result.requestId : -1
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
    const { openConnectedAccountsPopup, getThisTab } = initBGFunctions()
    const thisTab = await getThisTab()
    const { requestId } = await openConnectedAccountsPopup(
      {
        accountToChangeStatus: {
          name: accountId,
          origin: originId,
          img: accountImage ? accountImage : accountId && makeBlockie(accountId),
          accountActive: isMain,
        },
      },
      thisTab.id
    )
    return requestId
  }
}

const socialNetworkConnectionCondition = (props: ISocialNetworkConnectionCondition) => {
  const { socNet_id, near_id, url, fullname } = props
  return url.includes(socNet_id) && fullname.includes(near_id)
}

export default ConnectedAccounts
