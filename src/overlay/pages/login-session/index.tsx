import { initBGFunctions } from 'chrome-extension-message-wrapper'
import * as React from 'react'
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'
import { browser } from 'webextension-polyfill-ts'
import { Bus } from '../../../common/bus'
import { ChainTypes, DefaultSigners, LoginRequest } from '../../../common/types'
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
  redirect: string | null
}

export class LoginSession extends React.Component<Props, State> {
  constructor(p: Props) {
    super(p)
    this.state = {
      redirect: null,
    }
    this.routePages()
  }

  async routePages() {
    const loginRequest = this.props.request.loginRequest
    const chains = loginRequest.authMethods
    const secureLogin = loginRequest.secureLogin

    const { getWalletDescriptors, getSuitableLoginConfirmations } = await initBGFunctions(browser)

    const descriptors = await getWalletDescriptors()

    const connectedWallets = descriptors
      .filter((x) => x.connected)
      .filter((x) => (chains.length > 0 ? chains.includes(x.chain) : true))

    if (this.props.request.app === DefaultSigners.EXTENSION) {
      this.setState({ redirect: '/pairing' })
    }

    if (secureLogin === 'required') {
      // ToDo: handle optional mode
      const confirmations = await getSuitableLoginConfirmations(
        this.props.request.app,
        loginRequest
      )

      const validConfirmations = confirmations.filter(
        (x) => !!connectedWallets.find((y) => y.chain === x.authMethod && y.type === x.wallet)
      )

      if (validConfirmations.length > 0) {
        this.setState({ redirect: '/login-confirmations' })
        return
      }
    }

    if (connectedWallets.length > 0) {
      this.setState({ redirect: '/connected-wallets' })
    } else {
      this.setState({ redirect: '/pairing' })
    }
  }

  render() {
    const p = this.props
    const s = this.state
    const chains = this.props.request.loginRequest.authMethods

    return (
      <MemoryRouter>
        <Routes>
          <Route
            path="/login-confirmations"
            element={<LoginConfirmations bus={p.bus} data={p.request} />}
          />
          <Route
            path="/connected-wallets"
            element={<ConnectedWallets bus={p.bus} data={p.request} />}
          />
          <Route
            path="/pairing"
            element={<WalletPairing bus={p.bus} chains={chains as ChainTypes[]} data={p.request} />}
          />
          <Route
            path="/pairing/metamask"
            element={<MetaMask bus={p.bus} frameId={p.request.frameId} data={p.request} />}
          />
          <Route
            path="/pairing/walletconnect"
            element={<WalletConnect bus={p.bus} frameId={p.request.frameId} data={p.request} />}
          />
          <Route
            path="/pairing/near_testnet"
            element={
              <Near
                bus={p.bus}
                chain={ChainTypes.NEAR_TESTNET}
                frameId={p.request.frameId}
                data={p.request}
              />
            }
          />
          <Route
            path="/pairing/near_mainnet"
            element={
              <Near
                bus={p.bus}
                chain={ChainTypes.NEAR_MAINNET}
                frameId={p.request.frameId}
                data={p.request}
              />
            }
          />
          <Route
            path="/pairing/dapplets"
            element={<Dapplets bus={p.bus} frameId={p.request.frameId} data={p.request} />}
          />

          <Route path="*" element={s?.redirect ? <Navigate to={s.redirect} /> : null} />
        </Routes>
      </MemoryRouter>
    )
  }
}
