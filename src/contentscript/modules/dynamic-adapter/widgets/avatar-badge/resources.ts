import ETH_ICON from './assets/eth.svg'
import GITHUB_ICON from './assets/github.svg'
import NEAR_ICON from './assets/near-black.svg'
import TWITTER_ICON from './assets/twitter-icon.svg'

interface Resources {
  [name: string]: {
    uri: (name) => string
    pageName: string
    icon: string
  }
}

export const resources: Resources = {
  twitter: {
    uri: (name) => 'https://twitter.com/' + name,
    pageName: 'Twitter page',
    icon: TWITTER_ICON,
  },
  github: {
    uri: (name) => 'https://github.com/' + name,
    pageName: 'GitHub page',
    icon: GITHUB_ICON,
  },
  'near/testnet': {
    uri: (name) => 'https://explorer.testnet.near.org/accounts/' + name,
    pageName: 'NEAR Testnet explorer',
    icon: NEAR_ICON,
  },
  'near/mainnet': {
    uri: (name) => 'https://explorer.near.org/accounts/' + name,
    pageName: 'NEAR Mainnet explorer',
    icon: NEAR_ICON,
  },
  ethereum: {
    uri: (name) => 'https://goerli.etherscan.io/address/' + name,
    pageName: 'Etherscan page',
    icon: ETH_ICON,
  },
}
