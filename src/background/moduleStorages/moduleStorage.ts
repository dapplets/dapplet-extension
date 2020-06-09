import { Storage } from './storage';
import { HttpModuleStorage } from './httpModuleStorage';
import { SwarmModuleStorage } from './swarmModuleStorage';
import { StorageRef } from '../registries/registry';
import { ethers } from 'ethers';

export class StorageAggregator {

    async getResource(hashUris: StorageRef | string): Promise<ArrayBuffer> {
        if (typeof hashUris === 'string') {
            hashUris = {
                hash: null,
                uris: [hashUris]
            }
        }

        for (const uri of hashUris.uris) {
            const protocol = uri.substr(0, uri.indexOf('://'));
            const storage = this._chooseStorage(protocol);
            const buffer = await storage.getResource(uri);
            const hash = ethers.utils.keccak256(new Uint8Array(buffer));
            if (hashUris.hash !== null) {
                if (hash.replace('0x', '') !== hashUris.hash.replace('0x', '')) {
                    console.error(`Hash is not valid. URL: ${uri}, expected: ${hashUris.hash}, recieved: ${hash}`);
                } else {
                    //console.log(`Successful hash checking. URL: ${uri}, expected: ${hashUris.hash}, recieved: ${hash}`);
                    return buffer;
                }
            } else {
                console.warn(`Skiped hash checking. URL: ${uri}`);
                return buffer;
            }
        }

        throw Error("Can not fetch resource");
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