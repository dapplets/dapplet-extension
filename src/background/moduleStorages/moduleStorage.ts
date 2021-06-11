import { Storage } from './storage';
import { HttpModuleStorage } from './httpModuleStorage';
import { SwarmModuleStorage } from './swarmModuleStorage';
import { StorageRef } from '../registries/registry';
import { ethers } from 'ethers';
import { CentralizedModuleStorage } from './centralizedModuleStorage';
import GlobalConfigService from '../services/globalConfigService';
import * as logger from '../../common/logger';
import { StorageTypes } from '../../common/constants';

export class StorageAggregator {

    private _globalConfigService = new GlobalConfigService();

    async getResource(hashUris: StorageRef): Promise<ArrayBuffer> {

        if (hashUris.uris.length === 0) {
            throw Error("Resource doesn't have any URIs.");
        }

        for (const uri of hashUris.uris) {
            const protocol = uri.substr(0, uri.indexOf('://'));
            const decentStorage = await this._getStorageByProtocol(protocol);
            const centralizedStorage = new CentralizedModuleStorage();
            const fetchController = new AbortController();
            try {
                const decentStBuffer = decentStorage.getResource(uri, fetchController);
                const centStBuffer = centralizedStorage.getResource(hashUris.hash.replace('0x', ''), fetchController);
                const buffer = await Promise.any([decentStBuffer, centStBuffer]);
                fetchController.abort();
                if (this._checkHash(buffer, hashUris.hash, uri)) return buffer;
                // if (this._checkHash(buffer, hashUris.hash, uri)) {
                //     if (hashUris.hash) this._globalConfigService.getAutoBackup().then(x => x && this._backup(buffer, hashUris.hash.replace('0x', ''))); // don't wait
                //     return buffer;
                // }
            } catch (err) {
                logger.error(err);
            }
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

    public async saveDir(blob: Blob, targetStorages: StorageTypes[]): Promise<StorageRef> {
        const buffer = await (blob as any).arrayBuffer();
        const hash = ethers.utils.keccak256(new Uint8Array(buffer));
        const uris = [];

        for (const storageType of targetStorages) {
            const storage = await this._getStorageByType(storageType);
            const uri = await storage.saveDir(blob);
            uris.push(uri);
        }

        return { hash, uris };
    }

    private _checkHash(buffer: ArrayBuffer, expectedHash: string, uri: string) {
        if (expectedHash !== null) {
            const hash = ethers.utils.keccak256(new Uint8Array(buffer));
            if (hash.replace('0x', '') !== expectedHash.replace('0x', '')) {
                logger.error(`Hash is not valid. URL: ${uri}, expected: ${expectedHash}, recieved: ${hash}`);
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
        const swarmGatewayUrl = await this._globalConfigService.getSwarmGateway();

        switch (protocol) {
            case "http":
            case "https":
                return new HttpModuleStorage();
            case "bzz":
                return new SwarmModuleStorage({ swarmGatewayUrl });
            default:
                throw new Error("Unsupported protocol");
        }
    }

    private async _getStorageByType(type: StorageTypes): Promise<Storage> {
        const swarmGatewayUrl = await this._globalConfigService.getSwarmGateway();

        switch (type) {
            // case StorageTypes.TestRegsitry:
            //     return new HttpModuleStorage();
            case StorageTypes.Swarm:
                return new SwarmModuleStorage({ swarmGatewayUrl });
            default:
                throw new Error("Unsupported storage type");
        }
    }
}