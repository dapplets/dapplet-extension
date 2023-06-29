export interface GenericWallet {
  getAddress(): Promise<string>
  getChainId(): Promise<number>
  isAvailable(): Promise<boolean>
  isConnected(): Promise<boolean>
  connectWallet(params: any): Promise<void>
  disconnectWallet(): Promise<void>
  getLastUsage(): Promise<string>
  getMeta(): Promise<{
    icon: string
    name: string
    description: string
  } | null>
  signMessage(message: string): Promise<string>
}
