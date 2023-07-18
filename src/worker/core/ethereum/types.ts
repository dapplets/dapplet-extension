export interface ITransactionReceipt {
  transactionHash: string
  transactionIndex: string
  blockNumber: string
  blockHash: string
  cumulativeGasUsed: string
  gasUsed: string
  contractAddress: string | null
  logs: any[]
  logsBloom: string
  status: string
}

export interface IEtherneumWallet {
  request: ({ method, params }: { method: string; params: any[] }) => Promise<any>
  waitTransaction: (txHash: string, confirmations?: number) => Promise<ITransactionReceipt>
}
