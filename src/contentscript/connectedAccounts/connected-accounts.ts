import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
import { connectionCondition } from './connected-accounts-assembly'
import { Account, VerificationRequest } from './types'

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

  public async getVerificationRequest(id: string): Promise<VerificationRequest | null> {
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

  public async getRequestStatus(id: string): Promise<number> {
    const { getRequestStatus } = await initBGFunctions(browser)
    return getRequestStatus(id)
  }

  // ***** CALL *****

  public async requestVerification(
    props: {
      firstAccountId: string
      firstOriginId: string
      secondAccountId: string
      secondOriginId: string
      isUnlink: boolean
      firstProofUrl?: string
      secondProofUrl?: string
    },
    stake: number,
    condition: {
      type: string
      [name: string]: string
    }
  ): Promise<number> {
    const {
      firstAccountId,
      firstOriginId,
      secondAccountId,
      secondOriginId,
      firstProofUrl,
      secondProofUrl,
    } = props
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
          throw new Error('Сonnection conditions not met')
        }
        break
      default:
        throw new Error('Сonnection conditions not met')
    }

    if (canConnect) {
      const { requestVerification } = await initBGFunctions(browser)
      return requestVerification(props, stake)
    } else {
      throw new Error('Сonnection conditions not met')
    }
  }

  public async changeStatus(accountId: string, originId: string, isMain: boolean): Promise<void> {
    const { changeStatus } = await initBGFunctions(browser)
    changeStatus(accountId, originId, isMain)
  }
}

export default ConnectedAccounts
