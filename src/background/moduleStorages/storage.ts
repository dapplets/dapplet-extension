export interface Storage {
    timeout: number;
    getResource(uri: string): Promise<ArrayBuffer>;
}