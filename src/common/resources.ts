import GITHUB_ICON from './resources/social/github.svg'
import TWITTER_ICON from './resources/social/twitter-icon.svg'
import NEAR_ICON from './resources/wallets/near-black.svg'

export interface Resources {
  [name: string]: {
    title: string
    type: 'social' | 'wallet'
    icon: string
    proofUrl: (name: string) => string
  }
}

export const resources: Resources = {
  twitter: {
    title: 'Twitter',
    type: 'social',
    icon: TWITTER_ICON,
    proofUrl: (name) => 'https://twitter.com/' + name,
  },
  github: {
    title: 'GitHub',
    type: 'social',
    icon: GITHUB_ICON,
    proofUrl: (name) => 'https://github.com/' + name,
  },
  'near/testnet': {
    title: 'NEAR Testnet',
    type: 'wallet',
    icon: NEAR_ICON,
    proofUrl: () => null,
  },
}
