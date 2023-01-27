import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
import {
  EthSignature,
  DefaultSigners,
  ChainTypes,
  IConnectedAccountUser,
} from '../../../../../../../common/types'
import { resources } from '../../../../../../../common/resources'

export const getSignature = async (
  firstAccountName: string,
  secondAccountName: string,
  origin: string,
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
        origin_id: ChainTypes.NEAR_TESTNET,
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
    eth_sendCustomRequest,
  }: {
    eth_sendCustomRequest: (
      app: string | DefaultSigners,
      chain: ChainTypes,
      method: string,
      params: [string, string]
    ) => Promise<string>
  } = await initBGFunctions(browser)

  const result = await eth_sendCustomRequest(
    DefaultSigners.EXTENSION,
    origin === ChainTypes.ETHEREUM_GOERLI ? ChainTypes.ETHEREUM_GOERLI : ChainTypes.ETHEREUM_XDAI,
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

export const areWeLinkingWallets = (
  firstAccount: IConnectedAccountUser,
  secondAccount: IConnectedAccountUser
) =>
  !resources[firstAccount.origin].proofUrl(firstAccount.name) &&
  !resources[secondAccount.origin].proofUrl(secondAccount.name) &&
  resources[firstAccount.origin].type === 'wallet' &&
  resources[secondAccount.origin].type === 'wallet'
