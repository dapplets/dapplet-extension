export interface Storage {
    timeout: number;
    getResource(uri: string): Promise<ArrayBuffer>;
    save(blob: Blob, cfg?: any): Promise<string>;
    saveDir(tarBlob: Blob): Promise<string>;
}