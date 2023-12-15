import { ethers } from 'ethers'
import { ChainTypes } from '../../../common/types'
import { initBGFunctions } from '../../communication'
import { Connection, EventDef } from '../connection'
import { ProxySigner } from '../proxySigner'
import { IEtherneumWallet, ITransactionReceipt } from './types'

async function _sendWalletConnectTx(
  app: string,
  chain: ChainTypes,
  rpcMethod,
  rpcParams,
  callback: (e: { type: string; data?: any }) => void
): Promise<any> {
  const { eth_sendCustomRequest, eth_waitTransaction } = initBGFunctions()

  callback({ type: 'pending' })

  try {
    const txHash = await eth_sendCustomRequest(app, chain, rpcMethod, rpcParams)
    if (typeof txHash === 'string' && txHash.startsWith('0x') && txHash.length === 66) {
      callback({ type: 'result', data: txHash })
      callback({ type: 'created', data: txHash })
      const tx = await eth_waitTransaction(app, chain, txHash)
      callback({ type: 'mined', data: tx })
    } else {
      callback({ type: 'result', data: txHash })
    }
  } catch (err) {
    console.error(err)
    callback({ type: 'rejected', data: err })
  }
}

export async function createWalletConnection<T>(
  app: string,
  cfg: { network: string },
  eventDef?: EventDef<any>
): Promise<IEtherneumWallet> {
  const { network } = cfg
  const chain =
    network === 'sepolia'
      ? ChainTypes.ETHEREUM_SEPOLIA
      : network === 'xdai'
      ? ChainTypes.ETHEREUM_XDAI
      : null

  if (chain === null) {
    throw new Error('Only "sepolia" and "xdai" netowrks are supported.')
  }

  const transport = {
    _txCount: 0,
    _handler: null,
    exec: (rpcMethod: string, rpcParams: any) => {
      const id = (++transport._txCount).toString()
      _sendWalletConnectTx(app, chain, rpcMethod, rpcParams, (e) => transport._handler(id, e))
      return Promise.resolve(id)
    },
    onMessage: (handler: (topic: string, message: any) => void) => {
      transport._handler = handler
      return {
        off: () => (transport._handler = null),
      }
    },
  }

  const conn = new Connection<T>(transport, eventDef)
  const request = ({ method, params }: { method: string; params: any[] }): Promise<any> => {
    return new Promise((res, rej) => {
      conn.sendAndListen(method, params, {
        result: (_, { data }) => {
          res(data)
        },
        rejected: (_, { data }) => {
          rej(data)
        },
      })
    })
  }
  const waitTransaction = async (
    txHash: string,
    confirmations = 1
  ): Promise<ITransactionReceipt> => {
    while (true) {
      await new Promise((res) => setTimeout(res, 1000))
      const transactionReceipt: ITransactionReceipt = await request({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      })
      if (transactionReceipt) {
        const blockNumber = parseInt(transactionReceipt.blockNumber, 16)
        let lastBlockNumber = blockNumber
        while (true) {
          if (confirmations <= lastBlockNumber - blockNumber + 1) {
            return transactionReceipt
          }
          await new Promise((res) => setTimeout(res, 1000))
          const lastBlockNumberStr = await request({
            method: 'eth_blockNumber',
            params: [],
          })
          lastBlockNumber = parseInt(lastBlockNumberStr, 16)
        }
      }
    }
  }
  return { request, waitTransaction }
}

export async function createContractWrapper(
  app: string,
  cfg: { network: string },
  address: string,
  options: any
) {
  const { network } = cfg
  const chain =
    network === 'sepolia'
      ? ChainTypes.ETHEREUM_SEPOLIA
      : network === 'xdai'
      ? ChainTypes.ETHEREUM_XDAI
      : null

  if (chain === null) {
    throw new Error('Only "sepolia" and "xdai" netowrks are supported.')
  }

  const signer = new ProxySigner(app, chain)
  return new ethers.Contract(address, options, signer)
}
