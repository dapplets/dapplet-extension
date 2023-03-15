import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
import { ChainTypes, EthSignature, WalletTypes } from '../../../../../../../../common/types'

const getSignature = async (
  firstAccountName: string,
  firstAccountOrigin: string,
  secondAccountName: string,
  secondAccountOrigin: string,
  walletType: WalletTypes,
  statement: string
): Promise<EthSignature> => {
  const msgParams = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      LinkingAccounts: [
        { name: 'account_a', type: 'LinkingAccount' },
        { name: 'account_b', type: 'LinkingAccount' },
        { name: 'statement', type: 'string' },
      ],
      LinkingAccount: [
        { name: 'origin_id', type: 'string' },
        { name: 'account_id', type: 'string' },
      ],
    },
    domain: {
      name: 'Connected Accounts',
      version: '1',
      chainId: 5,
      verifyingContract: '0x0000000000000000000000000000000000000000',
    },
    primaryType: 'LinkingAccounts',
    message: {
      account_a: {
        origin_id: firstAccountOrigin,
        account_id: firstAccountName,
      },
      account_b: {
        origin_id: 'ethereum',
        account_id: secondAccountName,
      },
      statement,
    },
  }

  const msgParamsStr = JSON.stringify(msgParams)

  const {
    eth_sendCustomRequestToWallet,
  }: {
    eth_sendCustomRequestToWallet: (
      chain: ChainTypes,
      walletType: WalletTypes,
      method: string,
      params: any[]
    ) => Promise<any>
  } = await initBGFunctions(browser)

  const result: string = await eth_sendCustomRequestToWallet(
    secondAccountOrigin === ChainTypes.ETHEREUM_GOERLI
      ? ChainTypes.ETHEREUM_GOERLI
      : ChainTypes.ETHEREUM_XDAI,
    walletType,
    'eth_signTypedData_v3',
    [secondAccountName, msgParamsStr]
  )
  const sig = result.slice(2, 130) // first 64 bytes without 0x
  const v = result.slice(130, 132) // last 1 byte
  const compatibleV = parseInt('0x' + v) - 27
  const signature: EthSignature = {
    sig,
    v: compatibleV,
    mc: false,
  }
  return signature
}

export default getSignature
