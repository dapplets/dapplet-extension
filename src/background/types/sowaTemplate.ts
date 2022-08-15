export type SowaTemplate = {
  '@context': {
    [type: string]: string
  }

  views: {
    '@type': string
    template: string
  }[]

  transactions: {
    [name: string]: any
  }
}

export type StorageRef = {
  hash: string
  uris: string[]
}
