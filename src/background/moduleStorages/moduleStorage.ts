import { ethers } from 'ethers'
import { StorageTypes } from '../../common/constants'
import { Tar } from '../../common/tar'
import { StorageRef } from '../../common/types'
import FileBrowserStorage from '../browserStorages/fileBrowserStorage'
import File from '../models/file'
import GlobalConfigService from '../services/globalConfigService'
import { CentralizedModuleStorage } from './centralizedModuleStorage'
import { HttpModuleStorage } from './httpModuleStorage'
import { IpfsModuleStorage } from './ipfsModuleStorage'
import { Storage } from './storage'
import { SwarmModuleStorage } from './swarmModuleStorage'

export class StorageAggregator {
  private _fileBrowserStorage = new FileBrowserStorage()

  constructor(private _globalConfigService: GlobalConfigService) {}

  async getResource(hashUris: StorageRef): Promise<ArrayBuffer> {
    if (hashUris.hash) {
      const cachedFile = await this._fileBrowserStorage.getById(hashUris.hash)
      if (cachedFile) {
        return cachedFile.getData()
      }
    }

    const fetchController = new AbortController()
    const buffers = []

    const getVerifiedResource = async (storage, uri) => {
      const buffer = await storage.getResource(uri, fetchController)
      if (this._checkHash(buffer, hashUris.hash, uri)) return buffer
      throw new Error(
        `Hash is not valid. URL: ${uri}, expected: ${
          hashUris.hash
        }, recieved: ${ethers.utils.keccak256(new Uint8Array(buffer))}`
      )
    }

    const storageErrors = []
    for (const uri of hashUris.uris) {
      try {
        const protocol = uri.substr(0, uri.indexOf('://'))
        const decentStorage = await this._getStorageByProtocol(protocol)
        const decentStBuffer = getVerifiedResource(decentStorage, uri)
        buffers.push(decentStBuffer)
      } catch (e) {
        storageErrors.push(e)
      }
    }

    if (hashUris.hash) {
      const centralizedStorage = new CentralizedModuleStorage()
      const centStBuffer = getVerifiedResource(centralizedStorage, hashUris.hash.replace('0x', ''))
      buffers.push(centStBuffer)
    }

    if (buffers.length === 0) {
      throw new Error('No supported storages found', { cause: storageErrors })
    }

    try {
      const buffer = await Promise.any(buffers)
      fetchController.abort()

      // Cache to the browser storage
      if (hashUris.hash) {
        const file = new File()
        file.id = hashUris.hash
        file.setData(buffer)
        await this._fileBrowserStorage.create(file)
      }

      return buffer
    } catch (err) {
      console.error(err)
    }

    throw Error(`Can not fetch resource by URIs: ${hashUris.uris.join(', ')}`)
  }

  public async save(blob: Blob, targetStorages: StorageTypes[]): Promise<StorageRef> {
    const buffer = await (blob as any).arrayBuffer()
    const hash = ethers.utils.keccak256(new Uint8Array(buffer))

    // upload a file to all storages simultaneously
    const uris = await Promise.all(
      targetStorages.map((x) => this._getStorageByType(x).then((y) => y.save(blob)))
    )

    // backup to centralized storage
    const centralizedStorage = new CentralizedModuleStorage()
    const backupHash = await centralizedStorage.save(blob)
    if (hash.replace('0x', '') !== backupHash.replace('0x', '')) {
      throw Error(`Backup is corrupted: invalid hashes ${hash} ${backupHash}`)
    }

    return { hash, uris }
  }

  public async saveDir(
    files: { url: string; arr: ArrayBuffer }[],
    targetStorages: StorageTypes[]
  ): Promise<StorageRef> {
    const tar = await this._tarify(files)
    const buffer = await (tar as any).arrayBuffer()
    const hash = ethers.utils.keccak256(new Uint8Array(buffer))
    const uris = []

    for (const storageType of targetStorages) {
      const storage = await this._getStorageByType(storageType)

      if (!storage.saveDir) {
        continue
      }

      const uri = await storage.saveDir({ files, hash, tar })
      uris.push(uri)
    }

    // backup to centralized storage
    const centralizedStorage = new CentralizedModuleStorage()
    const backupHash = await centralizedStorage.saveDir({ files, hash, tar })
    if (hash.replace('0x', '') !== backupHash.replace('0x', '')) {
      throw Error(`Backup is corrupted: invalid hashes ${hash} ${backupHash}`)
    }

    return { hash, uris }
  }

  private _checkHash(buffer: ArrayBuffer, expectedHash: string, uri: string) {
    if (expectedHash !== null) {
      const hash = ethers.utils.keccak256(new Uint8Array(buffer))
      if (hash.replace('0x', '') !== expectedHash.replace('0x', '')) {
        console.error(
          `Hash is not valid. URL: ${uri}, expected: ${expectedHash}, recieved: ${hash}`
        )
        return false
      } else {
        //console.log(`[DAPPLETS]: Successful hash checking. URL: ${uri}, expected: ${hashUris.hash}, recieved: ${hash}`);
        return true
      }
    } else {
      // console.log(`[DAPPLETS]: Skiped hash checking. URL: ${uri}`);
      return true
    }
  }

  private async _getStorageByProtocol(protocol: string): Promise<Storage> {
    switch (protocol) {
      case 'http':
      case 'https':
        return new HttpModuleStorage()
      case 'bzz':
        const swarmGatewayUrl = await this._globalConfigService.getSwarmGateway()
        const swarmPostageStampId = await this._globalConfigService.getSwarmPostageStampId()
        return new SwarmModuleStorage({ swarmGatewayUrl, swarmPostageStampId })
      case 'ipfs':
        const ipfsGatewayUrl = await this._globalConfigService.getIpfsGateway()
        return new IpfsModuleStorage({ ipfsGatewayUrl })
      default:
        throw new Error('Unsupported protocol')
    }
  }

  private async _getStorageByType(type: StorageTypes): Promise<Storage> {
    switch (type) {
      // case StorageTypes.TestRegsitry:
      //     return new HttpModuleStorage();

      case StorageTypes.Swarm:
        const swarmGatewayUrl = await this._globalConfigService.getSwarmGateway()
        const swarmPostageStampId = await this._globalConfigService.getSwarmPostageStampId()
        return new SwarmModuleStorage({ swarmGatewayUrl, swarmPostageStampId })

      case StorageTypes.Ipfs:
        const ipfsGatewayUrl = await this._globalConfigService.getIpfsGateway()
        return new IpfsModuleStorage({ ipfsGatewayUrl })

      default:
        throw new Error('Unsupported storage type')
    }
  }

  private async _tarify(files: { url: string; arr: ArrayBuffer }[]): Promise<Blob> {
    const tar = new Tar()
    for (const file of files) {
      const path = file.url[0] === '/' ? file.url.slice(1) : file.url
      tar.addFileArrayBuffer(path, file.arr)
    }
    const blob = await tar.write()

    return blob
  }
}
