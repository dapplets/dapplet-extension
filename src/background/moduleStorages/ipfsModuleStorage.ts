import { joinUrls, timeoutPromise } from '../../common/helpers'
import { DirectoryData, Storage as ModuleStorage } from './storage'

export class IpfsModuleStorage implements ModuleStorage {
  private _gateway: string
  public timeout = 60000

  constructor(config: { ipfsGatewayUrl: string }) {
    this._gateway = config.ipfsGatewayUrl
  }

  public async getResource(
    uri: string,
    fetchController: AbortController = new AbortController()
  ): Promise<ArrayBuffer> {
    const response = await timeoutPromise(
      this.timeout,
      fetch(joinUrls(this._gateway, 'ipfs/' + this._extractReference(uri)), {
        signal: fetchController.signal,
      }),
      () => fetchController.abort()
    )

    if (!response.ok) {
      throw new Error(`IpfsStorage can't load resource by URI ${uri}`)
    }

    const buffer = await response.arrayBuffer()

    return buffer
  }

  private _extractReference(uri: string) {
    const result = uri.match(
      /Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,}/gm
    )
    if (!result || result.length === 0) throw new Error('Invalid IPFS CID')
    return result[0]
  }

  public async save(blob: Blob) {
    const response = await fetch(joinUrls(this._gateway, 'ipfs/'), {
      method: 'POST',
      body: blob,
    })

    if (!response.ok) {
      const error = await response
        .json()
        .then((x) => `${x.code} ${x.message}`)
        .catch(() => `${response.status} ${response.statusText}`)

      throw new Error(error)
    }

    const cid = response.headers.get('ipfs-hash')
    if (!cid) throw new Error('Cannot upload file to IPFS.') // ToDo: show message
    const url = 'ipfs://' + cid
    return url
  }

  public async saveDir(tarBlob: DirectoryData): Promise<string> {
    throw new Error('Not implemented')
    // const response = await fetch(joinUrls(this._gateway, 'bzz'), {
    //     method: 'POST',
    //     body: tarBlob,
    //     headers: {
    //         'swarm-index-document': 'index.html',
    //         'swarm-collection': 'true',
    //         'swarm-postage-batch-id': this._swarmPostageStampId
    //     }
    // });

    // if (!response.ok) {
    //     const error = await response.json()
    //         .then(x => `${x.code} ${x.message}`)
    //         .catch(() => `${response.status} ${response.statusText}`);

    //     throw new Error(error);
    // }

    // const json = await response.json();
    // if (!json.reference) throw new Error("Cannot upload file to Swarm."); // ToDo: show message
    // const url = "bzz://" + json.reference;
    // return url;
  }
}
