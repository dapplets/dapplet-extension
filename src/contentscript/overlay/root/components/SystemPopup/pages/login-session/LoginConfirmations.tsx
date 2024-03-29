import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import makeBlockie from 'ethereum-blockies-base64'
import * as React from 'react'
import browser from 'webextension-polyfill'
import LoginConfirmation from '../../../../../../../background/models/loginConfirmation'
import { Bus } from '../../../../../../../common/bus'
import * as walletIcons from '../../../../../../../common/resources/wallets'
import { LoginRequest, WalletDescriptor } from '../../../../../../../common/types'
import base from '../../components/Base.module.scss'
import { Button } from '../../components/Button'
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
  confirmations: LoginConfirmation[]
}

export class LoginConfirmations extends React.Component<Props, State> {
  private _mounted = false

  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      descriptors: [],
      confirmations: [],
    }
  }

  async componentDidMount() {
    this._mounted = true
    await this.loadData()
  }

  componentWillUnmount(): void {
    this._mounted = false
  }

  async loadData() {
    const { getWalletDescriptors, getSuitableLoginConfirmations } = await initBGFunctions(browser)
    const descriptors = await getWalletDescriptors()
    const confirmations = await getSuitableLoginConfirmations(
      this.props.data.app,
      this.props.data.loginRequest
    )

    if (this._mounted) {
      this.setState({
        descriptors,
        confirmations,
        loading: false,
      })
    }
  }

  async selectLoginConfirmation(wallet: string, chain: string, confirmationId: string) {
    const frameId = this.props.data.frameId
    this.props.bus.publish('ready', [frameId, { wallet, chain, confirmationId }])
    await this.componentDidMount()
  }

  render() {
    const s = this.state

    const chains = this.props.data.loginRequest.authMethods

    if (s.loading) return null

    const connectedWallets = s.descriptors
      .filter((x) => x.connected)
      .filter((x) => (x.chain ? chains.includes(x.chain) : true))
    const disconnectedWallets = s.descriptors
      .filter((x) => !x.connected)
      .filter((x) => (x.chain ? chains.includes(x.chain) : true))

    return (
      <div className={base.wrapper}>
        <h2 className={base.title}>Login Confirmations</h2>
        <p className={base.subtitle}>Reuse signed login confirmation</p>

        <ul className={base.list}>
          {s.confirmations.map((x, i) => {
            const wallet = connectedWallets.find(
              (y) => y.type === x.wallet && y.chain === x.authMethod
            )
            return (
              <li className={base.item} key={i}>
                <Session
                  key={i}
                  providerIcon={walletIcons[x.wallet] ? walletIcons[x.wallet] : null}
                  lastUsage={x.createdAt}
                  walletIcon={wallet?.meta?.icon}
                  account={
                    wallet.account.indexOf('0x') !== -1
                      ? wallet.account.substring(0, 6) + '...' + wallet.account.substring(38)
                      : wallet.account
                  }
                  accountIcon={wallet.account ? makeBlockie(wallet.account) : null}
                  buttons={
                    <Button
                      onClick={() =>
                        this.selectLoginConfirmation(
                          wallet.type,
                          wallet.chain,
                          x.loginConfirmationId
                        )
                      }
                    >
                      Select
                    </Button>
                  }
                />
              </li>
            )
          })}
        </ul>

        {connectedWallets.length > 0 ? (
          <button
            className={cn(base.createSession, base.link)}
            onClick={() => this.props.redirect('/connected-wallets')}
          >
            Sign new confirmation
          </button>
        ) : null}
      </div>
    )
  }
}
