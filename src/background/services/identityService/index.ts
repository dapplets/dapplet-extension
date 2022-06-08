import * as ethers from 'ethers'
import { ChainTypes, DefaultSigners } from '../../../common/types'
import GlobalConfigService from '../globalConfigService'
import { WalletService } from '../walletService'
import abi from './abi'

export enum AccountStatus {
  NoIssues,
  Exception,
  Scammer,
}

export enum ClaimStatus {
  InProgress,
  Approved,
  Rejected,
  Canceled,
}

export enum DomainTypes {
  Twitter = 1,
  ENS = 2,
  Ethereum = 3,
}

export enum ClaimTypes {
  NoIssues = 0,
  AccountMimicsAnotherOne = 1,
  UnusualBehaviour = 2,
  ProducesTooManyScams = 4,
}

export type Account = {
  domainId: DomainTypes // 1 - twitter, 2 - ens
  name: string
  status?: AccountStatus
}

export type Claim = {
  id: number
  claimTypes: number
  link: string | null
  oracle: string
  author: string
  accountIdx: number
  status: ClaimStatus
  timestamp: Date
}

export class IdentityService {
  private _contract: ethers.Contract

  constructor(
    private _globalConfigService: GlobalConfigService,
    private _walletService: WalletService
  ) {}

  private async _init() {
    if (this._contract) return
    const signer = await this._walletService.eth_getSignerFor(
      DefaultSigners.EXTENSION,
      ChainTypes.ETHEREUM_GOERLI
    )
    const address = await this._globalConfigService.getIdentityContract()
    this._contract = new ethers.Contract(address, abi, signer)
  }

  async getAccounts(account: Account): Promise<Account[]> {
    await this._init()
    const accounts = await this._contract.getAccounts(account)
    return accounts.map((x) => ({ domainId: x.domainId, name: x.name, status: x.status }))
  }

  async addAccount(oldAccount: Account, newAccount: Account) {
    await this._init()
    return this._contract.addAccount(oldAccount, newAccount)
  }

  async removeAccount(oldAccount: Account, newAccount: Account) {
    await this._init()
    return this._contract.removeAccount(oldAccount, newAccount)
  }

  async createClaim(claimTypes: number, link: string | null, account: Account, oracle: string) {
    await this._init()
    const linkBytes = link ? '0x' + link : '0x00'
    return this._contract.createClaim(claimTypes, linkBytes, account, oracle)
  }

  async cancelClaim(id: number) {
    await this._init()
    return this._contract.cancelClaim(id)
  }

  async approveClaim(id: number) {
    await this._init()
    return this._contract.approveClaim(id)
  }

  async rejectClaim(id: number) {
    await this._init()
    return this._contract.rejectClaim(id)
  }

  async getClaimsByAccount(account: Account): Promise<Claim[]> {
    await this._init()
    const [claims, indexes] = await this._contract.getClaimsByAccount(account)
    claims.forEach((c: Claim, i: number) => (c.id = indexes[i].toNumber()))
    claims.forEach(
      (c: Claim) =>
        (c.link =
          c.link === null || c.link === '0x' || c.link === '0x0' || c.link === '0x00'
            ? null
            : c.link.substring(2))
    )
    claims.forEach((c: any) => (c.timestamp = new Date(c.timestamp.toNumber() * 1000)))
    return claims
  }

  async getClaimsByOracle(oracle: string): Promise<Claim[]> {
    await this._init()
    const [claims, indexes] = await this._contract.getClaimsByOracle(oracle)
    claims.forEach((c: Claim, i: number) => (c.id = indexes[i].toNumber()))
    claims.forEach(
      (c: Claim) =>
        (c.link =
          c.link === null || c.link === '0x' || c.link === '0x0' || c.link === '0x00'
            ? null
            : c.link.substring(2))
    )
    claims.forEach((c: any) => (c.timestamp = new Date(c.timestamp.toNumber() * 1000)))
    return claims
  }
}
