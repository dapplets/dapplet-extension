import * as ethers from 'ethers'
import { ChainTypes, DefaultSigners, Falsy } from '../../../common/types'
import { StorageAggregator } from '../../moduleStorages/moduleStorage'
import GlobalConfigService from '../globalConfigService'
import { OverlayService } from '../overlayService'
import { WalletService } from '../walletService'
import abi from './app-token-registry.json'
import ERC20Interface from './ERC20Interface.json'
// todo: create cycle
const PAGE_SIZE = 20
const ZERO_SIZE = 0
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEFAULT_ECOSYSTEM = 'zoo'
const DEFAULT_APP_TYPE = 1

interface I_TokenFactory {}

export class TokenRegistryService {
  private tokenFactory: ethers.Contract

  constructor(
    private _globalConfigService: GlobalConfigService,
    private _walletService: WalletService,
    private overlayService: OverlayService,
    private _storageAggregator: StorageAggregator
  ) {}

  private async _init() {
    if (this.tokenFactory) return
    const signer = await this._walletService.eth_getSignerFor(
      DefaultSigners.EXTENSION,
      ChainTypes.ETHEREUM_SEPOLIA
    )
    // ToDo: get address from config, switch from goerli to sepolia
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
    referenceUrl: any,
    additionalCollaterals?: { addr: string; referenceUrl: string }[]
  ) {
    await this.tokenFactory.createAppToken(
      DEFAULT_APP_TYPE, //todo: mocked
      appId,
      DEFAULT_ECOSYSTEM, //todo: mocked
      symbol,
      name,
      referenceUrl.uris[1], // todo
      ZERO_ADDRESS, //todo: mocked
      ZERO_ADDRESS, //todo: mocked
      additionalCollaterals
    )
    await this.getTokensByApp(appId)
  }

  public async linkAppWithToken(appId: string, tokenAddress: string) {
    await this._init()

    await this.tokenFactory.linkAppWithToken(DEFAULT_APP_TYPE, appId, tokenAddress)
    await this.getTokensByApp(appId)
  }
  public async getErc20TokenInfo(tokenAddress: string | Falsy) {
    if (!tokenAddress) return undefined

    const signer = await this._walletService.eth_getSignerFor(
      DefaultSigners.EXTENSION, //todo:mocked
      ChainTypes.ETHEREUM_SEPOLIA //todo:mocked
    )

    const data = new ethers.Contract(tokenAddress, ERC20Interface, signer)

    const newData = {
      name: await data.name(),
      address: data.address,
      symbol: await data.symbol(),
    }

    return newData
  }
  public async saveBlobToIpfs(data: any, targetStorages) {
    const getData = () => {
      const buf = new ArrayBuffer(data.length)
      const bufView = new Uint8Array(buf)
      for (let i = 0, strLen = data.length; i < strLen; i++) {
        bufView[i] = data.charCodeAt(i)
      }
      return buf
    }
    const hashUris = await this._storageAggregator.save(
      new Blob([getData()], { type: 'image/png' }),
      targetStorages
    )
    return hashUris
  }
}
