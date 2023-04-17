import * as ethers from 'ethers'
import GlobalConfigService from '../globalConfigService'
import { WalletService } from '../walletService'
import { OverlayService } from '../overlayService'
import { StorageAggregator } from '../../moduleStorages/moduleStorage'
import abi from './app-token-registry.json'
import { ChainTypes, DefaultSigners } from '../../../common/types'
interface I_DUC {}

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
      const address = '0x0000000000000000000000000000000000000000'
      this.tokenFactory = new ethers.Contract(address, abi, signer)
    }
  
  

    public async getCounterStake(appId: string): Promise<number> {
      await this._init()
      // const counter = await this.tokenFactory.getCounterStake(
      //   appId
      // ) 
      // todo: mocked 
      function randomInteger(min, max) {
        let rand = min - 0.5 + Math.random() * (max - min + 1);
        return Math.round(rand);
      }
      const counter =  randomInteger(0,20)
      return counter
    }
  
  
   
  }