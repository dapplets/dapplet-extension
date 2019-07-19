import { Storage } from './storage';

export class HttpStorage implements Storage {
    public async getResource(uri: string): Promise<ArrayBuffer> {
        const response = await fetch(uri, { cache: 'no-store' });

        if (!response.ok) {
            throw new Error(`HttpStorage can't load resource by URI ${uri}`);
        }

        const buffer = await response.arrayBuffer();

        return buffer;
    }
}