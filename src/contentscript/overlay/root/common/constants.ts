export const regExpIndexNearTestnet = new RegExp(
  /^(?:[a-z0-9](?:[a-z0-9-_]{0,61}[a-z0-9])?\.)+testnet$/
)
export const regExpIndexNear = new RegExp(/^(?:[a-z0-9](?:[a-z0-9-_]{0,61}[a-z0-9])?\.)+near$/)
export const regExpIndexENS = new RegExp(/^(?:[a-z0-9](?:[a-z0-9-_]{0,61}[a-z0-9])?\.)+eth$/)
export const regExpIndexEthereum = new RegExp(/^0x[a-fA-F0-9]{40}$/)
export const regExpIndexNEARImplicit = new RegExp(/^[0-9a-z]{64}$/)
export const regExpIndexNEARDev = new RegExp(/^dev-\d*-\d*$/)
