import { Storage as ModuleStorage } from './storage';
import { timeoutPromise } from '../../common/helpers';
import { ethers } from 'ethers';

type PresignedPost = { [key: string]: string };

export class CentralizedModuleStorage implements ModuleStorage {
    public timeout = 5000;
    private _s3ReadEndpoint = "https://dapplet-api.s3-website.nl-ams.scw.cloud/";
    private _s3WriteEndpoint = "https://dapplet-api.s3.nl-ams.scw.cloud/";
    private _authEndpoint = "https://dapplet-api.herokuapp.com/s3/presign";

    public async getResource(hash: string, fetchController: AbortController = new AbortController()): Promise<ArrayBuffer> {
        const response = await timeoutPromise(
            this.timeout,
            fetch(this._s3ReadEndpoint + hash, { signal: fetchController.signal }),
            () => fetchController.abort()
        );

        if (!response.ok) {
            throw new Error(`CentralizedModuleStorage can't load resource by hash: ${hash}`);
        }

        const buffer = await response.arrayBuffer();

        return buffer;
    }

    public async save(blob: Blob) {
        const buffer = await (blob as any).arrayBuffer();
        const hash = ethers.utils.keccak256(new Uint8Array(buffer)).replace('0x', '');
        const presignedPost = await this._createPresignedPost(hash);
        await this._createObject(blob, presignedPost);
        return hash;
    }

    saveDir(tarBlob: Blob): Promise<string> {
        throw new Error('Method not implemented.');
    }

    private async _createPresignedPost(id: string): Promise<PresignedPost> {
        const body = JSON.stringify({ id });
        const response = await fetch(this._authEndpoint, {
            method: 'POST',
            body,
            headers: { 'Content-Type': 'application/json' }
        });

        const json = await response.json();
        if (!json.success) throw new Error(json.message || "Cannot create presigned post for S3 storage");
        return json.data.formData;
    }

    private async _createObject(blob: Blob, presignedPost: PresignedPost) {
        const form = new FormData();
        form.append('file', blob);
        Object.entries(presignedPost).forEach(([k, v]) => form.set(k, v));

        const response = await fetch(this._s3WriteEndpoint, {
            method: 'POST',
            body: form
        });

        if (!response.ok) throw new Error("Cannot save object to centralized storage");
    }
}