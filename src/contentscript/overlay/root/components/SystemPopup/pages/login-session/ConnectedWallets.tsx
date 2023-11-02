import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import makeBlockie from 'ethereum-blockies-base64'
import * as React from 'react'
import browser from 'webextension-polyfill'
import { Bus } from '../../../../../../../common/bus'
import * as walletIcons from '../../../../../../../common/resources/wallets'
import { LoginRequest, WalletDescriptor, WalletTypes } from '../../../../../../../common/types'
import base from '../../components/Base.module.scss'
import { Button } from '../../components/Button'
import { Loading } from '../../components/Loading'
import { Session } from '../../components/Session'

interface Props {
  data: {
    frameId: string
    app: string
    loginRequest: LoginRequest
  }
  bus: Bus
  redirect: (route: string) => void
}

interface State {
  loading: boolean
  descriptors: WalletDescriptor[]
  signing: {
    wallet: string
    error?: string | null
  } | null
  error: string
}

export class ConnectedWallets extends React.Component<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      descriptors: [],
      signing: null,
      error: null,
    }
  }

  async componentDidMount() {
    await this.loadData()
  }

  async loadData() {
    const { getWalletDescriptors } = await initBGFunctions(browser)
    const descriptors = await getWalletDescriptors()

    this.setState({
      descriptors,
      loading: false,
    })
  }

  async selectWallet(wallet: string, chain: string) {
    try {
      const frameId = this.props.data.frameId
      this.props.bus.publish('ready', [frameId, { wallet, chain }])
      await this.componentDidMount()
    } catch (err) {
      this.setState({ error: err.message })
    }
  }

  async loginWallet(wallet: string, chain: string) {
    try {
      this.setState({ signing: { wallet } })
      const { app, loginRequest } = this.props.data
      const { createLoginConfirmation } = await initBGFunctions(browser)
      const confirmation = await createLoginConfirmation(app, loginRequest, chain, wallet)
      const confirmationId = confirmation.loginConfirmationId
      const frameId = this.props.data.frameId
      this.props.bus.publish('ready', [frameId, { wallet, chain, confirmationId }])
      await this.componentDidMount()
    } catch (err) {
      this.setState({ error: err.message })
    }
  }

  render() {
    const s = this.state

    const chains = this.props.data.loginRequest.authMethods
    const { secureLogin, reusePolicy, creatingLoginConfirmationFailed } =
      this.props.data.loginRequest

    if (s.error) {
      return (
        <Loading
          title="Error"
          subtitle={s.error}
          content={<div></div>}
          onBackButtonClick={() => this.props.redirect('/')}
        />
      )
    }

    if (s.signing) {
      const title = {
        [WalletTypes.DAPPLETS]: 'Built-in Wallet',
        [WalletTypes.METAMASK]: 'MetaMask',
        [WalletTypes.NEAR]: 'MyNearWallet',
        [WalletTypes.WALLETCONNECT]: 'WalletConnect',
      }[s.signing.wallet]

      return (
        <Loading
          title={title}
          subtitle="Please confirm signing in your wallet to continue"
          onBackButtonClick={() => this.props.redirect('/')}
        />
      )
    }

    if (s.loading) return null

    const connectedWallets = s.descriptors
      .filter((x) => x.connected)
      .filter((x) => (x.chain ? chains.includes(x.chain) : true))

    const disconnectedWallets = s.descriptors
      .filter((x) => !x.connected)
      .filter((x) => (x.chain ? chains.includes(x.chain) : true))

    const isItAboutSigning = secureLogin === 'required' && reusePolicy === 'manual'

    return (
      <div className={base.wrapper}>
        <h2 className={base.title}>Connected Wallets</h2>

        {isItAboutSigning ? (
          <p className={base.subtitle}>Select connected wallet to sign a new login confirmation</p>
        ) : (
          <p className={base.subtitle}>Select connected wallet to log in</p>
        )}

        {creatingLoginConfirmationFailed && (
          <p className={base.warningMessage}>
            Connect a wallet that is already connected to the Dapplets extension. If you want to log
            in with another wallet, first connect it to the extension in the Wallets module.
          </p>
        )}

        <ul className={base.list}>
          {connectedWallets.map((x, i) => (
            <li className={base.item} key={i}>
              <Session
                key={i}
                providerIcon={walletIcons[x.type] ? walletIcons[x.type] : null}
                lastUsage={x.lastUsage}
                walletIcon={x.meta?.icon ? x.meta.icon : null}
                account={
                  x.account.indexOf('0x') !== -1
                    ? x.account.substring(0, 6) + '...' + x.account.substring(38)
                    : x.account
                }
                accountIcon={x.account ? makeBlockie(x.account) : null}
                buttons={
                  isItAboutSigning ? (
                    <Button onClick={() => this.loginWallet(x.type, x.chain)}>Sign</Button>
                  ) : (
                    <Button onClick={() => this.selectWallet(x.type, x.chain)}>Select</Button>
                  )
                }
              />
            </li>
          ))}
        </ul>

        {disconnectedWallets.length > 0 ? (
          <button
            className={cn(base.createSession, base.link)}
            onClick={() => this.props.redirect('/pairing')}
          >
            Connect another wallet
          </button>
        ) : null}
      </div>
    )
  }
}
