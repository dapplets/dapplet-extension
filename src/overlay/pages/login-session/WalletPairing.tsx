import { initBGFunctions } from 'chrome-extension-message-wrapper'
import * as React from 'react'
import { Navigate } from 'react-router-dom'
import { browser } from 'webextension-polyfill-ts'
// import * as logos from '../../../common/resources/wallets';
import { Bus } from '../../../common/bus'
import { ChainTypes, LoginRequest, WalletDescriptor, WalletTypes } from '../../../common/types'
import DappletsLogo from '../../assests/dapplets.svg'
import MetaMaskLogo from '../../assests/metamask.svg'
import NearMainnetLogo from '../../assests/near_mainnet.svg'
import NearTestnetLogo from '../../assests/near_testnet.svg'
import WalletConnectLogo from '../../assests/walletconnect.svg'
import { ConnectWallet } from './ConnectWallet'

interface IWalletPairingProps {
  data: {
    frameId: string
    app: string
    loginRequest: LoginRequest
  }
  bus: Bus
  chains: ChainTypes[]
}

interface IWalletPairingState {
  loading: boolean
  descriptors: WalletDescriptor[]
  redirect: string | null
  wallets: {
    id: string
    label: string
    icon: any
  }[]
}

export class WalletPairing extends React.Component<IWalletPairingProps, IWalletPairingState> {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      descriptors: [],
      redirect: null,
      wallets: [],
    }
  }

  async componentDidMount() {
    const p = this.props
    const secureLogin = this.props.data.loginRequest.secureLogin

    const { getWalletDescriptors } = await initBGFunctions(browser)
    const descriptors = await getWalletDescriptors()

    // const connectedWallets = this.state.descriptors
    //     .filter(x => x.connected)
    //     .filter(x => p.chains.length > 0 ? p.chains.includes(x.chain) : true);

    const disconnectedWallets = descriptors
      .filter((x) => !x.connected)
      .filter((x) => (p.chains.length > 0 ? p.chains.includes(x.chain) : true))
      .filter((x) => (secureLogin === 'required' ? x.chain === ChainTypes.ETHEREUM_GOERLI : true))

    const wallets = disconnectedWallets.map((x) => this.getMeta(x.type, x.chain))

    if (wallets.length === 0) {
      this.setState({ redirect: '/connected-wallets' })
    } else {
      this.setState({
        descriptors,
        wallets,
        loading: false,
      })
    }
  }

  async disconnectButtonClick(chain: ChainTypes, wallet: WalletTypes) {
    const { disconnectWallet } = await initBGFunctions(browser)
    await disconnectWallet(chain, wallet)
    await this.componentDidMount()
  }

  private _openMetamaskWebpage() {
    window.open('https://metamask.io/', '_blank')
    this.props.bus.publish('cancel')
  }

  getMeta(wallet: WalletTypes, chain: ChainTypes) {
    if (wallet === WalletTypes.METAMASK) {
      return {
        id: 'metamask',
        label: 'MetaMask',
        icon: MetaMaskLogo,
      }
    } else if (wallet === WalletTypes.WALLETCONNECT) {
      return {
        id: 'walletconnect',
        label: 'WalletConnect',
        icon: WalletConnectLogo,
      }
    } else if (wallet === WalletTypes.NEAR && chain === ChainTypes.NEAR_TESTNET) {
      return {
        id: 'near_testnet',
        label: 'NEAR Wallet (Testnet)',
        icon: NearTestnetLogo,
      }
    } else if (wallet === WalletTypes.NEAR && chain === ChainTypes.NEAR_MAINNET) {
      return {
        id: 'near_mainnet',
        label: 'NEAR Wallet (Mainnet)',
        icon: NearMainnetLogo,
      }
    } else if (wallet === WalletTypes.DAPPLETS) {
      return {
        id: 'dapplets',
        label: 'Built-in Test Only Wallet',
        icon: DappletsLogo,
      }
    }
  }

  render() {
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />
    }

    if (this.state.loading) return null

    return (
      <ConnectWallet
        onWalletClick={(id) => this.setState({ redirect: '/pairing/' + id })}
        wallets={this.state.wallets}
      />
    )
  }
}
