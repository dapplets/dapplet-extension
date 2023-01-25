import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { svgObject } from 'qr-image'
import * as React from 'react'
import { browser } from 'webextension-polyfill-ts'
import { Bus } from '../../../../../../../../common/bus'
import {
  ChainTypes,
  LoginRequest,
  WalletDescriptor,
  WalletTypes,
} from '../../../../../../../../common/types'
import { Loading } from '../../../components/Loading'

interface Props {
  data: {
    frameId: string
    app: string
    loginRequest: LoginRequest
  }
  bus: Bus
  chain: ChainTypes
  frameId: string
  redirect: (route: string) => void
}

interface State {
  svgPath: string
  connected: boolean
  signing: boolean
  error: string
  descriptor: WalletDescriptor | null
}

export default class WalletConnect extends React.Component<Props, State> {
  private _mounted = false

  constructor(props) {
    super(props)
    this.state = {
      svgPath: null,
      connected: false,
      signing: false,
      error: null,
      descriptor: null,
    }
  }

  async componentDidMount() {
    this._mounted = true

    try {
      const { connectWallet, getWalletDescriptors, createLoginConfirmation } =
        await initBGFunctions(browser)

      this.props.bus.subscribe('walletconnect', (uri) => {
        const svgPath = svgObject(uri, { type: 'svg' })
        this.setState({ svgPath: svgPath.path })
        this.props.bus.unsubscribe('walletconnect')
      })

      const overlayId = window.name.replace('dapplet-overlay/', '')
      await connectWallet(this.props.chain, WalletTypes.WALLETCONNECT, { overlayId })
      const descriptors = await getWalletDescriptors()
      const descriptor = descriptors.find((x) => x.type === WalletTypes.WALLETCONNECT)

      // sign message if required
      let confirmationId = undefined
      const secureLogin = this.props.data.loginRequest.secureLogin
      if (secureLogin === 'required') {
        this.setState({ signing: true })
        const app = this.props.data.app
        const loginRequest = this.props.data.loginRequest
        const chain = this.props.chain
        const wallet = WalletTypes.WALLETCONNECT
        const confirmation = await createLoginConfirmation(app, loginRequest, chain, wallet)
        confirmationId = confirmation.loginConfirmationId
      }

      if (this._mounted) {
        this.setState({ connected: true, descriptor })
        this.props.bus.publish('ready', [
          this.props.frameId,
          {
            wallet: WalletTypes.WALLETCONNECT,
            chain: this.props.chain,
            confirmationId,
          },
        ])
      }
    } catch (err) {
      if (this._mounted) {
        this.setState({ connected: true, error: err.message })
      }
    }
  }

  componentWillUnmount() {
    this._mounted = false
    this.props.bus.unsubscribe('walletconnect')
  }

  // async disconnect() {
  //     const { disconnectWallet } = await initBGFunctions(browser);
  //     await disconnectWallet(this.props.chain, WalletTypes.WALLETCONNECT);
  //     this.setState({ toBack: true });
  // }

  goBack() {
    this.props.redirect('/pairing')
  }

  render() {
    const s = this.state

    if (s.error)
      return (
        <Loading
          title="Error"
          subtitle={s.error}
          content={<div></div>}
          onBackButtonClick={this.goBack.bind(this)}
        />
      )

    if (s.signing)
      return (
        <Loading
          title="WalletConnect"
          subtitle="Please confirm signing in your wallet to continue"
          onBackButtonClick={this.goBack.bind(this)}
        />
      )

    if (!s.connected)
      return (
        <Loading
          title="WalletConnect"
          subtitle="Scan QR code with a WalletConnect-compatible wallet"
          content={
            s.svgPath ? (
              <svg style={{ margin: '30px 0' }} viewBox="1 1 53 53">
                <path d={s.svgPath} />
              </svg>
            ) : null
          }
          onBackButtonClick={this.goBack.bind(this)}
        />
      )

    // if (s.connected) return (<>
    //     <h3>Connected</h3>
    //     <p>The wallet is connected</p>
    //     {(s.descriptor.meta) ? <Segment style={{ textAlign: 'center' }}>
    //         <img src={s.descriptor.meta.icon} alt={s.descriptor.meta.name} style={{ width: '64px' }} />
    //         <div style={{ fontWeight: 'bold', fontSize: '1.3em' }}>{s.descriptor.meta.name}</div>
    //         <div>{s.descriptor.meta.description}</div>
    //         <div>{s.descriptor.account}</div>
    //     </Segment> : null}
    //     <div style={{ marginTop: '15px' }}>
    //         <Button onClick={() => this.disconnect()}>Disconnect</Button>
    //         <Button primary onClick={() => this.continue()}>Continue</Button>
    //     </div>
    // </>);

    return null
  }
}
