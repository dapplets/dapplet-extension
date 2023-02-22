import makeBlockie from 'ethereum-blockies-base64'
import * as nearAPI from 'near-api-js'
import * as EventBus from '../../common/global-event-bus'
import {
  ChainTypes,
  ConnectedAccountsPairStatus,
  ConnectedAccountsRequestStatus,
  DefaultSigners,
  IConnectedAccountsPair,
  IConnectedAccountUser,
  TConnectedAccount,
  TConnectedAccountsVerificationRequestInfo,
} from '../../common/types'
import GlobalConfigService from './globalConfigService'
import { WalletService } from './walletService'

type EthSignature = {
  sig: string
  v: number
  mc: boolean
}

export default class ConnectedAccountService {
  _testnetContract: nearAPI.Contract
  _mainnetContract: nearAPI.Contract

  constructor(
    private _globalConfigService: GlobalConfigService,
    private _walletService: WalletService
  ) {}

  private _createContract = (near_account: nearAPI.Account, contractAddress: string) =>
    new nearAPI.Contract(near_account, contractAddress, {
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

  private async _getContract() {
    const contractNetwork = await this._globalConfigService.getPreferredConnectedAccountsNetwork()
    switch (contractNetwork) {
      case 'mainnet':
        if (!this._mainnetContract) {
          const contractAddress =
            await this._globalConfigService.getConnectedAccountsMainnetContractAddress()
          const near_account = await this._walletService.near_getAccount(
            DefaultSigners.EXTENSION,
            ChainTypes.NEAR_MAINNET
          )
          this._mainnetContract = this._createContract(near_account, contractAddress)
        }
        return this._mainnetContract
      case 'testnet':
        if (!this._testnetContract) {
          const contractAddress =
            await this._globalConfigService.getConnectedAccountsTestnetContractAddress()
          const near_account = await this._walletService.near_getAccount(
            DefaultSigners.EXTENSION,
            ChainTypes.NEAR_TESTNET
          )
          this._testnetContract = this._createContract(near_account, contractAddress)
        }
        return this._testnetContract
    }
  }

  // ***** VIEW *****

  public async getConnectedAccounts(
    accountId: string,
    originId: string,
    closeness?: number
  ): Promise<TConnectedAccount[][] | null> {
    const contract = await this._getContract()
    return contract['getConnectedAccounts']({
      accountId,
      originId,
      closeness: closeness === null ? undefined : closeness,
    })
  }

  public async getMinStakeAmount(): Promise<number> {
    const contract = await this._getContract()
    return contract['getMinStakeAmount']()
  }

  public async getPendingRequests(): Promise<number[]> {
    const contract = await this._getContract()
    return contract['getPendingRequests']()
  }

  public async getVerificationRequest(
    id: number
  ): Promise<TConnectedAccountsVerificationRequestInfo | null> {
    const contract = await this._getContract()
    return contract['getVerificationRequest']({ id })
  }

  public async getStatus(accountId: string, originId: string): Promise<boolean> {
    const contract = await this._getContract()
    return contract['getStatus']({ accountId, originId })
  }

  public async getMainAccount(accountId: string, originId: string): Promise<string | null> {
    const contract = await this._getContract()
    return contract['getMainAccount']({ accountId, originId })
  }

  public async getRequestStatus(id: number): Promise<ConnectedAccountsRequestStatus> {
    const contract = await this._getContract()
    const status = await contract['getRequestStatus']({ id })
    switch (status) {
      case 0:
        return ConnectedAccountsRequestStatus.NotFound
      case 1:
        return ConnectedAccountsRequestStatus.Pending
      case 2:
        return ConnectedAccountsRequestStatus.Approved
      case 3:
        return ConnectedAccountsRequestStatus.Rejected
      default:
        throw new Error('Error in Connected Accounts getRequestStatus()')
    }
  }

  public async getPairs({
    prevPairs,
  }: {
    prevPairs: IConnectedAccountsPair[] | null
  }): Promise<IConnectedAccountsPair[]> {
    const descriptors: {
      account: string
      chain: string
      connected: boolean
    }[] = await this._walletService.getWalletDescriptors()
    const connectedDescriptors = descriptors.filter((d) => d.connected === true)
    if (!connectedDescriptors || connectedDescriptors.length === 0) return

    let newPairs: IConnectedAccountsPair[] = []
    const processingAccountIdsPairs: [string, string][] = []
    const newPendingIds: number[] = []

    for (const d of connectedDescriptors) {
      const connectedAccStatus: boolean = await this.getStatus(d.account, d.chain)
      const connectedAccount: IConnectedAccountUser = {
        name: d.account,
        origin: d.chain,
        img: makeBlockie(d.account),
        accountActive: connectedAccStatus,
      }
      const globalId = d.account + '/' + d.chain

      // *** PENDING ***
      const addPendingPair = async (accountGlobalId: string, pendingRequestId: number) => {
        const [name, origin1, origin2] = accountGlobalId.split('/')
        const origin = origin2 ? origin1 + '/' + origin2 : origin1
        const accStatus: boolean = await this.getStatus(name, origin)
        newPairs.push({
          firstAccount: connectedAccount,
          secondAccount: {
            name,
            origin,
            img: makeBlockie(name),
            accountActive: accStatus,
          },
          statusName: ConnectedAccountsPairStatus.Processing,
          statusMessage: 'Processing',
          closeness: 1,
          pendingRequestId,
        })
        processingAccountIdsPairs.push([globalId, accountGlobalId])
        newPendingIds.push(pendingRequestId)
      }

      const pendingRequestsIds: number[] = await this.getPendingRequests()
      if (pendingRequestsIds && pendingRequestsIds.length > 0) {
        for (const pendingRequestId of pendingRequestsIds) {
          const verificationRequest: TConnectedAccountsVerificationRequestInfo =
            await this.getVerificationRequest(pendingRequestId)
          const { firstAccount, secondAccount } = verificationRequest
          if (firstAccount === globalId) {
            await addPendingPair(secondAccount, pendingRequestId)
          } else if (secondAccount === globalId) {
            await addPendingPair(firstAccount, pendingRequestId)
          }
        }
      }

      // *** CONNECTED ***
      const connectedAccounts: TConnectedAccount[][] = await this.getConnectedAccounts(
        d.account,
        d.chain,
        null
      )
      connectedAccounts.forEach((level, i) =>
        level.forEach((ca) => {
          if (this._hasEqualIdsPair([globalId, ca.id], processingAccountIdsPairs)) return
          const [caName, caOrigin1, caOrigin2] = ca.id.split('/')
          newPairs.push({
            firstAccount: connectedAccount,
            secondAccount: {
              name: caName,
              origin: caOrigin2 ? caOrigin1 + '/' + caOrigin2 : caOrigin1,
              img: makeBlockie(caName),
              accountActive: ca.status.isMain,
            },
            statusName: ConnectedAccountsPairStatus.Connected,
            statusMessage: 'Connected',
            closeness: i + 1,
          })
        })
      )
    }

    // *** REJECTED ***
    if (prevPairs) {
      const prevPendingPairs = prevPairs.filter(
        (pair) => pair.statusName && pair.statusName === ConnectedAccountsPairStatus.Processing
      )
      const resolvedPairs = prevPendingPairs.filter(
        (prevPair) => !newPendingIds.includes(prevPair.pendingRequestId!)
      )
      if (resolvedPairs.length !== 0) {
        for (const resolvedPair of resolvedPairs) {
          const requestStatus: ConnectedAccountsRequestStatus = await this.getRequestStatus(
            resolvedPair.pendingRequestId!
          )
          if (requestStatus !== ConnectedAccountsRequestStatus.Rejected) continue

          const newPairsLengthBeforeFilter = newPairs.length
          newPairs = newPairs.filter(
            (p) =>
              !(
                p.firstAccount.name === resolvedPair.firstAccount.name &&
                p.firstAccount.origin === resolvedPair.firstAccount.origin &&
                p.secondAccount.name === resolvedPair.secondAccount.name &&
                p.secondAccount.origin === resolvedPair.secondAccount.origin
              ) &&
              !(
                p.secondAccount.name === resolvedPair.firstAccount.name &&
                p.secondAccount.origin === resolvedPair.firstAccount.origin &&
                p.firstAccount.name === resolvedPair.secondAccount.name &&
                p.firstAccount.origin === resolvedPair.secondAccount.origin
              )
          )
          newPairs.unshift({
            firstAccount: resolvedPair.firstAccount,
            secondAccount: resolvedPair.secondAccount,
            statusName: ConnectedAccountsPairStatus.Error,
            statusMessage:
              newPairsLengthBeforeFilter === newPairs.length
                ? 'Connection rejected'
                : 'Disconnection rejected',
            closeness: 1,
          })
        }
      }
    }
    return newPairs
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
      signature?: EthSignature
      statement?: string
    },
    stake?: number
  ): Promise<number> {
    const {
      firstAccountId,
      firstOriginId,
      secondAccountId,
      secondOriginId,
      isUnlink,
      firstProofUrl,
      secondProofUrl,
      signature,
      statement,
    } = props
    const contract = await this._getContract()
    const requestBody = {
      firstAccountId,
      firstOriginId,
      secondAccountId,
      secondOriginId,
      isUnlink,
      firstProofUrl: firstProofUrl === null ? undefined : firstProofUrl,
      secondProofUrl: secondProofUrl === null ? undefined : secondProofUrl,
      signature: signature === undefined ? null : signature,
      statement: statement === null ? undefined : statement,
    }
    const gas = signature ? 300_000_000_000_000 : null
    const amount = stake === null ? undefined : stake
    const res = await contract['requestVerification'](requestBody, gas, amount)
    EventBus.emit('connected_accounts_changed')
    return res
  }

  public async changeStatus(accountId: string, originId: string, isMain: boolean): Promise<void> {
    const contract = await this._getContract()
    const res = await contract['changeStatus']({
      accountId,
      originId,
      isMain,
    })
    EventBus.emit('connected_accounts_changed')
    return res
  }

  private _hasEqualIdsPair(pair: [string, string], list: [string, string][]): boolean {
    for (const one of list) {
      if (
        (one[0] === pair[0] && one[1] === pair[1]) ||
        (one[0] === pair[1] && one[1] === pair[0])
      ) {
        return true
      }
    }
    return false
  }
}
