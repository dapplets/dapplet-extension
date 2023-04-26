import * as ethers from 'ethers'
import * as EventBus from '../../../common/global-event-bus'
import { ChainTypes, DefaultSigners } from '../../../common/types'
import { StorageAggregator } from '../../moduleStorages/moduleStorage'
import GlobalConfigService from '../globalConfigService'
import { OverlayService } from '../overlayService'
import { WalletService } from '../walletService'
import abi from './DappletRegistry.abi.json'
interface I_DUC {}
interface Stake {
   amount: number
   duration: number
   endsAt: number
}
export class UnderConstructionService {
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
      ChainTypes.ETHEREUM_GOERLI
    )
    const address = '0xa0D2FB6f71F09E60aF1eD7344D4BB8Bb4c83C9af'
    this.tokenFactory = new ethers.Contract(address, abi, signer)
  }


  public async getStakeStatus(appId: string): Promise<number> {
    await this._init()
      const stakeStatus = await this.tokenFactory.getStakeStatus(
      appId
    )
    return stakeStatus
  }

  public async calcExtendedStake(
    appId: string,
    secondsDuration: number
) : Promise<number> {
  await this._init()
  const extendedStake = await this.tokenFactory.calcExtendedStake(
    appId,secondsDuration
  )
  return extendedStake
}

public async calcStake( duration:number): Promise<number> {
  await this._init()
  const price = await this.tokenFactory.calcStake(
    duration
  )
  return price
}
public async stakes(appId: string): Promise<Stake>{
  await this._init()
  const stake = await this.tokenFactory.stakes(
    appId
  )
  return stake
}
public async burnDUC(moduleName:string){
  await this._init()
 await this.tokenFactory.stakes(
  moduleName
)
}

public async getCounterStake(appId: string): Promise<number> {
  await this._init()
  // const counter = await this.tokenFactory.getCounterStake(
  //   appId
  // )
  // todo: mocked
  function randomInteger(min, max) {
    let rand = min - 0.5 + Math.random() * (max - min + 1)
    return Math.round(rand)
  }
  const counter = randomInteger(0, 20)
  return counter
}
  public async setBurnDucToken(appId: string) {
    //  await this.tokenFactory.setBurnDucToken(
    //     appId
    //   )
    // todo: mocked

    setTimeout(() => {
      EventBus.emit('token_burned')
    }, 1500)

    await this._init()
  }
}
