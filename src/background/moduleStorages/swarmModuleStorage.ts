import { Storage as ModuleStorage } from './storage';
import * as ethers from 'ethers';

export class SwarmModuleStorage implements ModuleStorage {
    public async getResource(uri: string): Promise<ArrayBuffer> {
        const url = new URL(uri);
        const expectedHash = url.hash.substring(1);

        const response = await fetch("https://swarm-gateways.net/" + uri);

        if (!response.ok) {
            throw new Error(`HttpStorage can't load resource by URI ${uri}`);
        }

        const buffer = await response.arrayBuffer();
        const keccak = ethers.utils.keccak256(new Uint8Array(buffer)).substring(2);
        
        // ToDo: move this checking to moduleStorage.ts
        if (!!expectedHash) {
            if (keccak !== expectedHash) {
                console.error(`Hash is not valid. URL: ${uri}, expected: ${expectedHash}, recieved: ${keccak}`);
                throw Error('Hash is not valid.');
            } else {
                console.log(`Successful hash checking. URL: ${uri}, expected: ${expectedHash}, recieved: ${keccak}`);
            }
        } else {
            console.warn(`Skiped hash checking. URL: ${uri}`);
        }

        return buffer;
    }
}