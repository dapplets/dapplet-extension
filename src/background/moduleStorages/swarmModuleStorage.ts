import { Storage as ModuleStorage } from './storage';

export class SwarmModuleStorage implements ModuleStorage {
    public async getResource(uri: string): Promise<ArrayBuffer> {
        const response = await fetch("https://swarm-gateways.net/" + uri);

        if (!response.ok) {
            throw new Error(`HttpStorage can't load resource by URI ${uri}`);
        }

        const buffer = await response.arrayBuffer();

        return buffer;
    }
}