import * as nearAPI from 'near-api-js'
import { DefaultSigners } from '../../common/types'
import GlobalConfigService from './globalConfigService'
import { WalletService } from './walletService'

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

export default class ConnectedAccountService {
  _contract: any

  constructor(
    private _globalConfigService: GlobalConfigService,
    private _walletService: WalletService
  ) {}

  private async _getContract() {
    if (!this._contract) {
      const contractAddress = await this._globalConfigService.getConnectedAccountsContractAddress()
      const near_account = await this._walletService.near_getAccount(DefaultSigners.EXTENSION)
      this._contract = new nearAPI.Contract(near_account, contractAddress, {
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

    return this._contract
  }

  // ***** VIEW *****

  public async getConnectedAccounts(
    accountId: string,
    originId: string,
    closeness?: number
  ): Promise<Account[][] | null> {
    const contract = await this._getContract()
    return contract.getConnectedAccounts({
      accountId,
      originId,
      closeness: closeness === null ? undefined : closeness,
    })
  }

  public async getMinStakeAmount(): Promise<number> {
    const contract = await this._getContract()
    return contract.getMinStakeAmount()
  }

  public async getPendingRequests(): Promise<number[]> {
    const contract = await this._getContract()
    return contract.getPendingRequests()
  }

  public async getVerificationRequest(id: number): Promise<VerificationRequest | null> {
    const contract = await this._getContract()
    return contract.getVerificationRequest({ id })
  }

  public async getStatus(accountId: string, originId: string): Promise<boolean> {
    const contract = await this._getContract()
    return contract.getStatus({ accountId, originId })
  }

  public async getMainAccount(accountId: string, originId: string): Promise<string | null> {
    const contract = await this._getContract()
    return contract.getMainAccount({ accountId, originId })
  }

  public async getRequestStatus(
    id: number
  ): Promise<'not found' | 'pending' | 'approved' | 'rejected'> {
    const contract = await this._getContract()
    const status = await contract.getRequestStatus({ id })
    switch (status) {
      case 0:
        return 'not found'
      case 1:
        return 'pending'
      case 2:
        return 'approved'
      case 3:
        return 'rejected'
      default:
        throw new Error('Error in Connected Accounts getRequestStatus()')
    }
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
    stake: number
  ): Promise<number> {
    const {
      firstAccountId,
      firstOriginId,
      secondAccountId,
      secondOriginId,
      isUnlink,
      firstProofUrl,
      secondProofUrl,
    } = props
    const contract = await this._getContract()
    return contract.requestVerification(
      {
        firstAccountId,
        firstOriginId,
        secondAccountId,
        secondOriginId,
        isUnlink,
        firstProofUrl: firstProofUrl === null ? undefined : firstProofUrl,
        secondProofUrl: secondProofUrl === null ? undefined : secondProofUrl,
      },
      undefined,
      stake
    )
  }

  public async changeStatus(accountId: string, originId: string, isMain: boolean): Promise<void> {
    const contract = await this._getContract()
    contract.changeStatus({
      accountId,
      originId,
      isMain,
    })
  }
}
