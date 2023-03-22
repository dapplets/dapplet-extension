import { ERC20Interface, Falsy } from '@usedapp/core'
import * as ethers from 'ethers'
import { ChainTypes, DefaultSigners } from '../../../common/types'
import GlobalConfigService from '../globalConfigService'
import { OverlayService } from '../overlayService'
import { WalletService } from '../walletService'

export const useToken = async (tokenAddress: string | Falsy) => {
  if (!tokenAddress) return undefined

  const globalConfigService = new GlobalConfigService()
  const overlayService = new OverlayService()
  const _walletService = new WalletService(globalConfigService, overlayService)
  const signer = await _walletService.eth_getSignerFor(
    DefaultSigners.EXTENSION, //todo:mocked
    ChainTypes.ETHEREUM_GOERLI //todo:mocked
  )

  const data = new ethers.Contract(tokenAddress, ERC20Interface, signer)

  const newData = {
    name: await data.name(),
    address: data.address,
    symbol: await data.symbol(),
  }

  return newData
}
