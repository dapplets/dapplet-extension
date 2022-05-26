import { Connection, InMemorySigner, Near } from 'near-api-js'
import { BackgroundJsonRpcProvider } from './backgroundJsonRpcProvider'
import { BackgroundKeyStore } from './backgroundKeyStore'

export class BackgroundNear extends Near {
  constructor(
    app: string,
    cfg: { networkId: string; nodeUrl: string; walletUrl: string; helperUrl?: string }
  ) {
    super({ ...cfg, deps: { keyStore: new BackgroundKeyStore() } })
    const provider = new BackgroundJsonRpcProvider(app, cfg.networkId)
    const keystore = new BackgroundKeyStore()
    const signer = new InMemorySigner(keystore)
    const connection = new Connection('default', provider, signer)
    Object.defineProperty(this, 'connection', {
      value: connection,
    })
  }
}
