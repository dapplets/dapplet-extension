export interface Storage {
    timeout: number;
    getResource(uri: string, fetchController: AbortController): Promise<ArrayBuffer>;
    save(blob: Blob, cfg?: any): Promise<string>;
    saveDir(data: any): Promise<string>;
}