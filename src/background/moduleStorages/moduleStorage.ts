import { Storage } from './storage';
import { HttpModuleStorage } from './httpModuleStorage';
import { SwarmModuleStorage } from './swarmModuleStorage';
import { StorageRef } from '../registries/registry';
import { ethers } from 'ethers';
import { CentralizedModuleStorage } from './centralizedModuleStorage';
import GlobalConfigService from '../services/globalConfigService';

export class StorageAggregator {

    private _globalConfigService = new GlobalConfigService();

    async getResource(hashUris: StorageRef): Promise<ArrayBuffer> {

        if (hashUris.uris.length === 0) {
            throw Error("Resource doesn't have any URIs.");
        }

        for (const uri of hashUris.uris) {
            const protocol = uri.substr(0, uri.indexOf('://'));
            const storage = this._chooseStorage(protocol);

            try {
                const buffer = await storage.getResource(uri);
                if (uri.indexOf('a80e93e003f6aaf0d17dcf19c5c76670e379190d601ce60de6422d2e10256f75') !== -1) console.log('found!', hashUris.hash);
                if (this._checkHash(buffer, hashUris.hash, uri)) {
                    if (hashUris.hash) this._globalConfigService.getAutoBackup().then(x => x && this._backup(buffer, hashUris.hash.replace('0x', ''))); // don't wait
                    return buffer;
                }
            } catch (err) {
                console.error(err);
            }
        }

        if (hashUris.hash) {
            const centralizedStorage = new CentralizedModuleStorage();
            const buffer = await centralizedStorage.getResource(hashUris.hash.replace('0x', ''));
            if (this._checkHash(buffer, hashUris.hash, hashUris.hash)) return buffer;
        }

        throw Error("Can not fetch resource");
    }

    private async _backup(buffer: ArrayBuffer, hash: string) {
        const centralizedStorage = new CentralizedModuleStorage();
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const newHash = await centralizedStorage.save(blob);
        if (hash !== newHash) console.error('Backup is corrupted: invalid hashes', hash, newHash);
    }

    private _checkHash(buffer: ArrayBuffer, expectedHash: string, uri: string) {
        if (expectedHash !== null) {
            const hash = ethers.utils.keccak256(new Uint8Array(buffer));
            if (hash.replace('0x', '') !== expectedHash.replace('0x', '')) {
                console.error(`Hash is not valid. URL: ${uri}, expected: ${expectedHash}, recieved: ${hash}`);
                return false;
            } else {
                //console.log(`Successful hash checking. URL: ${uri}, expected: ${hashUris.hash}, recieved: ${hash}`);
                return true;
            }
        } else {
            console.warn(`Skiped hash checking. URL: ${uri}`);
            return true;
        }
    }

    private _chooseStorage(protocol: string): Storage {
        switch (protocol) {
            case "http":
            case "https":
                return new HttpModuleStorage();
            case "bzz":
                return new SwarmModuleStorage();
            default:
                throw new Error("Unsupported protocol");
        }
    }
}