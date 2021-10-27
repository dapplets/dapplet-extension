import { Storage } from './storage';
import { HttpModuleStorage } from './httpModuleStorage';
import { SwarmModuleStorage } from './swarmModuleStorage';
import { StorageRef } from '../registries/registry';
import { ethers } from 'ethers';
import { CentralizedModuleStorage } from './centralizedModuleStorage';
import GlobalConfigService from '../services/globalConfigService';

import { StorageTypes } from '../../common/constants';
import { Tar } from '../../common/tar';
import { promiseAny } from '../../common/helpers';
import { IpfsModuleStorage } from './ipfsModuleStorage';
import { SiaModuleStorage } from './siaModuleStorage';

export class StorageAggregator {

    private _globalConfigService = new GlobalConfigService();

    async getResource(hashUris: StorageRef): Promise<ArrayBuffer> {

        if (hashUris.uris.length === 0) {
            throw Error(`Resource doesn't have any URIs. Hash: ${hashUris.hash}`);
        }

        const fetchController = new AbortController();
        const buffers = [];

        const getVerifiedResource = async (storage, uri) => {
            const buffer = await storage.getResource(uri, fetchController);
            if (this._checkHash(buffer, hashUris.hash, uri)) return buffer;
            throw new Error(`Hash is not valid. URL: ${uri}, expected: ${hashUris.hash}, recieved: ${ethers.utils.keccak256(new Uint8Array(buffer))}`)
        };

        for (const uri of hashUris.uris) {
            const protocol = uri.substr(0, uri.indexOf('://'));
            const decentStorage = await this._getStorageByProtocol(protocol);
            const decentStBuffer = getVerifiedResource(decentStorage, uri);
            buffers.push(decentStBuffer);
        }

        if (hashUris.hash) {
            const centralizedStorage = new CentralizedModuleStorage();
            const centStBuffer = getVerifiedResource(centralizedStorage, hashUris.hash.replace('0x', ''));
            buffers.push(centStBuffer);
        }

        try {
            const buffer = await promiseAny(buffers);
            fetchController.abort();

            return buffer;
            // if (this._checkHash(buffer, hashUris.hash, uri)) {
            //     if (hashUris.hash) this._globalConfigService.getAutoBackup().then(x => x && this._backup(buffer, hashUris.hash.replace('0x', ''))); // don't wait
            //     return buffer;
            // }
        } catch (err) {
            console.error(err);
        }

        throw Error(`Can not fetch resource by URIs: ${hashUris.uris.join(', ')}`);
    }

    public async save(blob: Blob, targetStorages: StorageTypes[]): Promise<StorageRef> {
        const buffer = await (blob as any).arrayBuffer();
        const hash = ethers.utils.keccak256(new Uint8Array(buffer));
        const uris = [];

        for (const storageType of targetStorages) {
            const storage = await this._getStorageByType(storageType);
            const uri = await storage.save(blob);
            uris.push(uri);
        }

        // backup to centralized storage
        const centralizedStorage = new CentralizedModuleStorage();
        const backupHash = await centralizedStorage.save(blob);
        if (hash.replace('0x', '') !== backupHash.replace('0x', '')) {
            throw Error(`Backup is corrupted: invalid hashes ${hash} ${backupHash}`);
        }

        return { hash, uris };
    }

    public async saveDir(files: { url: string, arr: ArrayBuffer }[], targetStorages: StorageTypes[]): Promise<StorageRef> {
        const blob = await this._tarify(files);
        const buffer = await (blob as any).arrayBuffer();
        const hash = ethers.utils.keccak256(new Uint8Array(buffer));
        const uris = [];

        for (const storageType of targetStorages) {
            const storage = await this._getStorageByType(storageType);
            const uri = await storage.saveDir(blob);
            uris.push(uri);
        }

        // backup to centralized storage
        const centralizedStorage = new CentralizedModuleStorage();
        const backupHash = await centralizedStorage.saveDir({ files, hash });
        if (hash.replace('0x', '') !== backupHash.replace('0x', '')) {
            throw Error(`Backup is corrupted: invalid hashes ${hash} ${backupHash}`);
        }

        return { hash, uris };
    }

    private _checkHash(buffer: ArrayBuffer, expectedHash: string, uri: string) {
        if (expectedHash !== null) {
            const hash = ethers.utils.keccak256(new Uint8Array(buffer));
            if (hash.replace('0x', '') !== expectedHash.replace('0x', '')) {
                console.error(`Hash is not valid. URL: ${uri}, expected: ${expectedHash}, recieved: ${hash}`);
                return false;
            } else {
                //console.log(`[DAPPLETS]: Successful hash checking. URL: ${uri}, expected: ${hashUris.hash}, recieved: ${hash}`);
                return true;
            }
        } else {
            console.log(`[DAPPLETS]: Skiped hash checking. URL: ${uri}`);
            return true;
        }
    }

    private async _getStorageByProtocol(protocol: string): Promise<Storage> {
        switch (protocol) {
            case "http":
            case "https":
                return new HttpModuleStorage();
            case "bzz":
                const swarmGatewayUrl = await this._globalConfigService.getSwarmGateway();
                const swarmPostageStampId = await this._globalConfigService.getSwarmPostageStampId();
                return new SwarmModuleStorage({ swarmGatewayUrl, swarmPostageStampId });
            case "ipfs":
                const ipfsGatewayUrl = await this._globalConfigService.getIpfsGateway();
                return new IpfsModuleStorage({ ipfsGatewayUrl });
            case "sia":
                const siaPortalUrl = await this._globalConfigService.getSiaPortal();
                return new SiaModuleStorage({ siaPortalUrl });
            default:
                throw new Error("Unsupported protocol");
        }
    }

    private async _getStorageByType(type: StorageTypes): Promise<Storage> {
        switch (type) {
            // case StorageTypes.TestRegsitry:
            //     return new HttpModuleStorage();

            case StorageTypes.Swarm:
                const swarmGatewayUrl = await this._globalConfigService.getSwarmGateway();
                const swarmPostageStampId = await this._globalConfigService.getSwarmPostageStampId();
                return new SwarmModuleStorage({ swarmGatewayUrl, swarmPostageStampId });

            case StorageTypes.Ipfs:
                const ipfsGatewayUrl = await this._globalConfigService.getIpfsGateway();
                return new IpfsModuleStorage({ ipfsGatewayUrl });
                
            case StorageTypes.Sia:
                const siaPortalUrl = await this._globalConfigService.getSiaPortal();
                return new SiaModuleStorage({ siaPortalUrl });

            default:
                throw new Error("Unsupported storage type");
        }
    }

    private async _tarify(files: { url: string, arr: ArrayBuffer }[]): Promise<Blob> {
        const tar = new Tar();
        for (const file of files) {
            const path = (file.url[0] === '/') ? file.url.slice(1) : file.url;
            tar.addFileArrayBuffer(path, file.arr);
        }
        const blob = await tar.write();

        return blob;
    }
}