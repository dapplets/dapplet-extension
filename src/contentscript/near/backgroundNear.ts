import { Connection, InMemorySigner, Near } from 'near-api-js'
import { BackgroundJsonRpcProvider } from './backgroundJsonRpcProvider'
import { BackgroundKeyStore } from './backgroundKeyStore'

export class BackgroundNear extends Near {
  constructor(
    app: string,
    cfg: { networkId: string; nodeUrl: string; walletUrl: string; helperUrl?: string },
    keyStorePrefix?: string
  ) {
    const keyStore = new BackgroundKeyStore(keyStorePrefix)
    const signer = new InMemorySigner(keyStore)
    super({ ...cfg, deps: { keyStore }, signer })
    const provider = new BackgroundJsonRpcProvider(app, cfg.networkId)
    const connection = new Connection(cfg.networkId, provider, signer)
    Object.defineProperty(this, 'connection', {
      value: connection,
    })
  }
}
