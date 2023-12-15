const IPFS_GATEWAY = 'https://ipfs-gateway.mooo.com'

const DEFAULT_NETWORK = 'sepolia'

const DEFAULT_CHAIN_ID = 11155111

const DEFAULT_ECOSYSTEM = 'zoo'

const DEFAULT_APP_TYPE = 1

// text
const ERROR_MESSAGES = {
  IPFS_UPLOAD_FAIL: 'Cannot upload file to IPFS.',
  MINING_ERROR: 'Transaction mining failed. Please, try again.',
  PROVIDER_ADDITION_INCORRECT_ADDRESS: 'You are trying to enter the wrong address',
  PROVIDER_ADDITION_INCORRECT_ADDRESS_WRONG_NETWORK:
    'This provider does not match the current network',
  TOKEN_ICON_INPUT_OVER_SIZE: 'Image dimensions are larger than 128px*128px',
  TOKEN_ICON_INPUT_UNSUPPORTED_EXTENSION: 'Only PNG or SVG supported',
}

export {
  DEFAULT_ECOSYSTEM,
  DEFAULT_APP_TYPE,
  IPFS_GATEWAY,
  DEFAULT_NETWORK,
  DEFAULT_CHAIN_ID,
  ERROR_MESSAGES,
}
