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
  NearNetworks,
  TConnectedAccount,
  TConnectedAccountsVerificationRequestInfo,
  WalletDescriptorWithCAMainStatus,
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
        'areConnected',
        'getNet',
      ],
      changeMethods: ['requestVerification', 'changeStatus'],
    })

  private async _getContract(network?: NearNetworks) {
    const contractNetwork =
      network === NearNetworks.Mainnet || network === NearNetworks.Testnet
        ? network
        : await this._globalConfigService.getPreferredConnectedAccountsNetwork()
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
    closeness?: number,
    network?: NearNetworks
  ): Promise<TConnectedAccount[][] | null> {
    const contract = await this._getContract(network)
    return contract['getConnectedAccounts']({
      accountId,
      originId,
      closeness: closeness === null ? undefined : closeness,
    })
  }

  public async getMinStakeAmount(network?: NearNetworks): Promise<number> {
    const contract = await this._getContract(network)
    return contract['getMinStakeAmount']()
  }

  public async getPendingRequests(network?: NearNetworks): Promise<number[]> {
    const contract = await this._getContract(network)
    return contract['getPendingRequests']()
  }

  public async getVerificationRequest(
    id: number,
    network?: NearNetworks
  ): Promise<TConnectedAccountsVerificationRequestInfo | null> {
    const contract = await this._getContract(network)
    return contract['getVerificationRequest']({ id })
  }

  public async getStatus(
    accountId: string,
    originId: string,
    network?: NearNetworks
  ): Promise<boolean> {
    const contract = await this._getContract(network)
    return contract['getStatus']({ accountId, originId })
  }

  public async areConnected(
    accountGId1: string,
    accountGId2: string,
    network?: NearNetworks
  ): Promise<boolean> {
    const contract = await this._getContract(network)
    return contract['areConnected']({ accountGId1, accountGId2 })
  }

  public async getNet(accountGId: string, network?: NearNetworks): Promise<string[] | null> {
    const contract = await this._getContract(network)
    return contract['getNet']({ accountGId })
  }

  public async getMainAccount(
    accountId: string,
    originId: string,
    network?: NearNetworks
  ): Promise<string | null> {
    const contract = await this._getContract(network)
    return contract['getMainAccount']({ accountId, originId })
  }

  public async getRequestStatus(
    id: number,
    network?: NearNetworks
  ): Promise<ConnectedAccountsRequestStatus> {
    const contract = await this._getContract(network)
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
    receiver,
    prevPairs,
  }: {
    receiver: WalletDescriptorWithCAMainStatus
    prevPairs: IConnectedAccountsPair[] | null
  }): Promise<IConnectedAccountsPair[]> {
    let newPairs: IConnectedAccountsPair[] = []
    const processingAccountIdsPairs: [string, string][] = []
    const newPendingIds: number[] = []

    const receiverOrigin =
      receiver.chain === ChainTypes.ETHEREUM_GOERLI || receiver.chain === ChainTypes.ETHEREUM_XDAI
        ? 'ethereum'
        : receiver.chain
    const receiverConnectedAccountUser: IConnectedAccountUser = {
      name: receiver.account,
      origin: receiverOrigin,
      img: receiver.account && makeBlockie(receiver.account),
      accountActive: receiver.accountActive,
    }
    const globalId = receiver.account + '/' + receiverOrigin

    // *** PENDING ***
    const addPendingPair = async (accountGlobalId: string, pendingRequestId: number) => {
      const [name, origin1, origin2] = accountGlobalId.split('/')
      const origin = origin2 ? origin1 + '/' + origin2 : origin1
      const accStatus: boolean = await this.getStatus(name, origin)
      newPairs.push({
        firstAccount: receiverConnectedAccountUser,
        secondAccount: {
          name,
          origin,
          img: name && makeBlockie(name),
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
      receiver.account,
      receiverOrigin,
      null
    )
    connectedAccounts.forEach((level, i) =>
      level.forEach((ca) => {
        if (this._hasEqualIdsPair([globalId, ca.id], processingAccountIdsPairs)) return
        const [caName, caOrigin1, caOrigin2] = ca.id.split('/')
        newPairs.push({
          firstAccount: receiverConnectedAccountUser,
          secondAccount: {
            name: caName,
            origin: caOrigin2 ? caOrigin1 + '/' + caOrigin2 : caOrigin1,
            img: caName && makeBlockie(caName),
            accountActive: ca.status.isMain,
          },
          statusName: ConnectedAccountsPairStatus.Connected,
          statusMessage: 'Connected',
          closeness: i + 1,
        })
      })
    )

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
    stake?: number,
    network?: NearNetworks
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
    const contract = await this._getContract(network)
    const requestBody: {
      firstAccountId: string
      firstOriginId: string
      secondAccountId: string
      secondOriginId: string
      isUnlink: boolean
      firstProofUrl?: string
      secondProofUrl?: string
      signature?: EthSignature
      statement?: string
    } = {
      firstAccountId,
      firstOriginId,
      secondAccountId,
      secondOriginId,
      isUnlink,
    }
    if (firstProofUrl) requestBody.firstProofUrl = firstProofUrl
    if (secondProofUrl) requestBody.secondProofUrl = secondProofUrl
    requestBody.signature = signature === undefined ? null : signature
    if (statement) requestBody.statement = statement

    const gas = signature ? 300_000_000_000_000 : 30_000_000_000_000
    const amount = stake === null ? undefined : stake
    const res = await contract['requestVerification'](requestBody, gas, amount)
    EventBus.emit('connected_accounts_changed')
    return res
  }

  public async changeStatus(
    accountId: string,
    originId: string,
    isMain: boolean,
    network?: NearNetworks
  ): Promise<void> {
    const contract = await this._getContract(network)
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
