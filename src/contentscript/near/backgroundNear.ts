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
    console.log('** BackgroundJsonRpcProvider', provider)
    const keystore = new BackgroundKeyStore()
    console.log('** BackgroundKeyStore', keystore)
    const signer = new InMemorySigner(keystore)
    console.log('** InMemorySigner', signer)
    const connection = new Connection('default', provider, signer)
    console.log('** InMemorySigner', connection)
    Object.defineProperty(this, 'connection', {
      value: connection,
    })
  }
}
