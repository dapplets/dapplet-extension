import { initBGFunctions } from 'chrome-extension-message-wrapper'
import * as React from 'react'
import browser from 'webextension-polyfill'
import { Bus } from '../../../../../../../common/bus'
import { ChainTypes, DefaultSigners, LoginRequest } from '../../../../../../../common/types'
import { ConnectedWallets } from './ConnectedWallets'
import { LoginConfirmations } from './LoginConfirmations'
import { WalletPairing } from './WalletPairing'
import Dapplets from './wallets/Dapplets'
import MetaMask from './wallets/MetaMask'
import Near from './wallets/Near'
import WalletConnect from './wallets/WalletConnect'

interface Props {
  request: {
    frameId: string
    app: string
    loginRequest: LoginRequest
  }
  bus: Bus
}

interface State {
  route: string
}

export class LoginSession extends React.Component<Props, State> {
  constructor(p: Props) {
    super(p)
    this.state = {
      route: '',
    }
  }

  componentDidMount(): void {
    this.routePages()
  }

  async routePages() {
    const { loginRequest } = this.props.request
    const chains = loginRequest.authMethods
    const { secureLogin, reusePolicy } = loginRequest

    const { getWalletDescriptors, getSuitableLoginConfirmations } = await initBGFunctions(browser)

    const descriptors = await getWalletDescriptors()

    const connectedWallets = descriptors
      .filter((x) => x.connected)
      .filter((x) => (chains.length > 0 ? chains.includes(x.chain) : true))

    if (this.props.request.app === DefaultSigners.EXTENSION) {
      this.redirect('/pairing')
      return
    }

    const isItAboutSigning = secureLogin === 'required' && reusePolicy === 'manual'

    if (isItAboutSigning) {
      // ToDo: handle optional mode
      const confirmations = await getSuitableLoginConfirmations(
        this.props.request.app,
        loginRequest
      )

      const validConfirmations = confirmations.filter(
        (x) => !!connectedWallets.find((y) => y.chain === x.authMethod && y.type === x.wallet)
      )

      if (validConfirmations.length > 0) {
        this.redirect('/login-confirmations')
        return
      }
    }

    if (connectedWallets.length > 0) {
      this.redirect('/connected-wallets')
    } else {
      this.redirect('/pairing')
    }
  }

  redirect(newRoute: string) {
    this.setState({ route: newRoute })
  }

  render() {
    const p = this.props
    const s = this.state
    const chains = this.props.request.loginRequest.authMethods

    switch (s.route) {
      case '/login-confirmations':
        return (
          <LoginConfirmations bus={p.bus} data={p.request} redirect={this.redirect.bind(this)} />
        )

      case '/connected-wallets':
        return <ConnectedWallets bus={p.bus} data={p.request} redirect={this.redirect.bind(this)} />

      case '/pairing':
        return (
          <WalletPairing
            bus={p.bus}
            chains={chains as ChainTypes[]}
            data={p.request}
            redirect={this.redirect.bind(this)}
          />
        )

      case '/pairing/metamask_goerli':
        return (
          <MetaMask
            bus={p.bus}
            frameId={p.request.frameId}
            chain={ChainTypes.ETHEREUM_GOERLI}
            data={p.request}
            redirect={this.redirect.bind(this)}
          />
        )

      case '/pairing/walletconnect_goerli':
        return (
          <WalletConnect
            bus={p.bus}
            frameId={p.request.frameId}
            chain={ChainTypes.ETHEREUM_GOERLI}
            data={p.request}
            redirect={this.redirect.bind(this)}
          />
        )

      case '/pairing/dapplets_goerli':
        return (
          <Dapplets
            bus={p.bus}
            frameId={p.request.frameId}
            chain={ChainTypes.ETHEREUM_GOERLI}
            data={p.request}
            redirect={this.redirect.bind(this)}
          />
        )

      case '/pairing/metamask_xdai':
        return (
          <MetaMask
            bus={p.bus}
            frameId={p.request.frameId}
            chain={ChainTypes.ETHEREUM_XDAI}
            data={p.request}
            redirect={this.redirect.bind(this)}
          />
        )

      case '/pairing/walletconnect_xdai':
        return (
          <WalletConnect
            bus={p.bus}
            frameId={p.request.frameId}
            chain={ChainTypes.ETHEREUM_XDAI}
            data={p.request}
            redirect={this.redirect.bind(this)}
          />
        )

      case '/pairing/dapplets_xdai':
        return (
          <Dapplets
            bus={p.bus}
            frameId={p.request.frameId}
            chain={ChainTypes.ETHEREUM_XDAI}
            data={p.request}
            redirect={this.redirect.bind(this)}
          />
        )

      case '/pairing/near_testnet':
        return (
          <Near
            bus={p.bus}
            chain={ChainTypes.NEAR_TESTNET}
            frameId={p.request.frameId}
            data={p.request}
            redirect={this.redirect.bind(this)}
          />
        )

      case '/pairing/near_mainnet':
        return (
          <Near
            bus={p.bus}
            chain={ChainTypes.NEAR_MAINNET}
            frameId={p.request.frameId}
            data={p.request}
            redirect={this.redirect.bind(this)}
          />
        )

      default:
        return null
    }
  }
}
