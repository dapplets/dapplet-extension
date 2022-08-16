import makeBlockie from 'ethereum-blockies-base64'
import * as nearAPI from 'near-api-js'
import {
  ConnectedAccountsPairStatus,
  ConnectedAccountsRequestStatus,
  DefaultSigners,
  IConnectedAccountsPair,
  IConnectedAccountUser,
  TConnectedAccount,
  TConnectedAccountsVerificationRequest,
} from '../../common/types'
import GlobalConfigService from './globalConfigService'
import { WalletService } from './walletService'

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
  ): Promise<TConnectedAccount[][] | null> {
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

  public async getVerificationRequest(
    id: number
  ): Promise<TConnectedAccountsVerificationRequest | null> {
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

  public async getRequestStatus(id: number): Promise<ConnectedAccountsRequestStatus> {
    const contract = await this._getContract()
    const status = await contract.getRequestStatus({ id })
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
    let processingAccountIdsPairs: [string, string][] = []
    let newPendingIds: number[] = []

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
          const verificationRequest: TConnectedAccountsVerificationRequest =
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
    return contract.changeStatus({
      accountId,
      originId,
      isMain,
    })
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
