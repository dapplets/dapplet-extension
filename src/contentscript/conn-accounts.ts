import * as nearAPI from 'near-api-js'

type VerificationRequest = {
  firstAccount: string
  secondAccount: string
  isUnlink: boolean
  firstProofUrl: string
  secondProofUrl: string
  transactionSender: string
}

type AccountStatus = {
  isMain: boolean
}

type Account = {
  id: string
  status: AccountStatus
}

class ConnectedAccounts {
  private _contract: any

  constructor(private _nearAccount: nearAPI.ConnectedWalletAccount) {
    this._contract = new nearAPI.Contract(this._nearAccount, 'dev-1657809840477-71552146558217', {
      viewMethods: [
        'getConnectedAccounts',
        'getMinStakeAmount',
        'getPendingRequests',
        'getVerificationRequest',
        'getStatus',
        'getMainAccount',
        'getRequestStatus',
      ],
      changeMethods: ['requestVerification', 'changeStatus'],
    })
  }

  // ***** VIEW *****

  public async getConnectedAccounts(
    accountId: string,
    originId: string,
    closeness?: number
  ): Promise<Account[][] | null> {
    return this._contract.getConnectedAccounts({
      accountId,
      originId,
      closeness,
    })
  }

  public async getMinStakeAmount(): Promise<number> {
    return this._contract.getMinStakeAmount()
  }

  public async getPendingRequests(): Promise<number[]> {
    return this._contract.getPendingRequests()
  }

  public async getVerificationRequest(id: string): Promise<VerificationRequest | null> {
    return this._contract.getVerificationRequest({ id })
  }

  public async getStatus(accountId: string, originId: string): Promise<boolean> {
    return this._contract.getStatus({ accountId, originId })
  }

  public async getMainAccount(accountId: string, originId: string): Promise<string | null> {
    return this._contract.getMainAccount({ accountId, originId })
  }

  public async getRequestStatus(id: string): Promise<number> {
    return this._contract.getRequestStatus({ id })
  }

  // ***** CALL *****

  public async requestVerification(props: {
    firstAccountId: string
    firstOriginId: string
    secondAccountId: string
    secondOriginId: string
    isUnlink: boolean
    firstProofUrl?: string
    secondProofUrl?: string
  }): Promise<number> {
    return this._contract.requestVerification(props)
  }

  public async changeStatus(accountId: string, originId: string, isMain: boolean): Promise<void> {
    this._contract.changeStatus({
      accountId,
      originId,
      isMain,
    })
  }
}

export default ConnectedAccounts
