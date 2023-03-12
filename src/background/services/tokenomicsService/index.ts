import * as ethers from 'ethers'
import { ChainTypes, DefaultSigners } from '../../../common/types'
import GlobalConfigService from '../globalConfigService'
import { WalletService } from '../walletService'
import abi from './app-token-registry.json'
import * as EventBus from '../../../common/global-event-bus'
// todo: create cycle
const PAGE_SIZE = 20
const ZERO_SIZE = 0
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEFAULT_ECOSYSTEM = 'zoo'
const DEFAULT_APP_TYPE = 1
type Falsy = false | 0 | '' | null | undefined

interface I_TokenFactory {}

export class TokenRegistryService {
  private tokenFactory: ethers.Contract

  constructor(
    private _globalConfigService: GlobalConfigService,
    private _walletService: WalletService
  ) {}

  private async _init() {
    if (this.tokenFactory) return
    const signer = await this._walletService.eth_getSignerFor(
      DefaultSigners.EXTENSION,
      ChainTypes.ETHEREUM_GOERLI
    )
    const address = '0x34Ef7E1354D7F032aa7968b410B152c2B579260A'
    this.tokenFactory = new ethers.Contract(address, abi, signer)
  }

  public async getTokensByApp(appId: string): Promise<I_TokenFactory[]> {
    await this._init()
    const tokens = await this.tokenFactory.getTokensByApp(
      DEFAULT_APP_TYPE,
      appId,
      ZERO_SIZE,
      PAGE_SIZE
    ) // todo: mocked: DEFAULT_APP_TYPE, ZERO_SIZE, PAGE_SIZE
    return tokens
  }

  public async getAppsByToken(addressToken: string): Promise<string[]> {
    await this._init()
    const apps = await this.tokenFactory.getAppsByToken(addressToken, ZERO_SIZE, PAGE_SIZE) // todo: mocked: ZERO_SIZE, PAGE_SIZE

    return apps
  }

  public async createAppToken(
    appId: string,
    symbol: string,
    name: string,
    referenceUrl: File | string,
    additionalCollaterals?: { addr: string; referenceUrl: string }[]
  ) {
    await this._init()
    await this.tokenFactory.createAppToken(
      DEFAULT_APP_TYPE, //todo: mocked
      appId,
      DEFAULT_ECOSYSTEM, //todo: mocked
      symbol,
      name,
      referenceUrl,
      ZERO_ADDRESS, //todo: mocked
      ZERO_ADDRESS, //todo: mocked
      additionalCollaterals
    )
    await this.getTokensByApp(appId)
    EventBus.emit('token create')
  }

  public async linkAppWithToken(appId: string, tokenAddress: string) {
    await this._init()

    await this.tokenFactory.linkAppWithToken(DEFAULT_APP_TYPE, appId, tokenAddress)
    await this.getTokensByApp(appId)
    EventBus.emit('token create')
  }
}
