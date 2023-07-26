export type DirectoryData = {
  files: { url: string; arr: ArrayBuffer }[]
  hash: string
  tar: Blob
}

export interface Storage {
  timeout: number
  getResource(uri: string, fetchController: AbortController): Promise<ArrayBuffer>
  save(blob: Blob, cfg?: any): Promise<string>
  saveDir?(data: DirectoryData): Promise<string>
}
