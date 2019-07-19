export interface Storage {
    getResource(uri: string): Promise<ArrayBuffer>;
}