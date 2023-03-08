import GlobalConfigService from '../globalConfigService'
import { WalletService } from '../walletService'

interface I_AppOwnershipAdapter {
  ownerOf(string, memory, appId): Promise<string>
}

interface I_TokenFactory {}
export class TokenRegistryService {
  public tokenFactory

  constructor(
    private _globalConfigService: GlobalConfigService,
    private _walletService: WalletService
  ) {}
  public async getTokensByApp(appId: string): Promise<I_TokenFactory[]> {
    const tokens = await this.tokenFactory.getTokensByApp(appId)
    return tokens
  }

  public async getAppsByToken(symbol: string): Promise<string[]> {
    const apps = await this.tokenFactory.getAppsByToken(symbol)

    return apps
  }
  public async createAppToken(
    appType: number,
    appId: string,
    ecosystemCode: string,
    symbol: string,
    name: string,
    referenceUrl: string,
    curveTemplate: string,
    tokenTemplate: string,
    additionalCollaterals?: { addr: string; referenceUrl: string }[]
  ) {
    return await this.tokenFactory.createAppToken(
      appType,
      appId,
      ecosystemCode,
      symbol,
      name,
      referenceUrl,
      curveTemplate,
      tokenTemplate,
      additionalCollaterals
    )
  }

  public async linkAppWithToken(appType: number, appId: string, tokenAddress: string) {
    return await this.tokenFactory.linkAppWithToken(appType, appId, tokenAddress)
  }

  // modifier onlyAppOwner(uint appType, string memory appId)
}
