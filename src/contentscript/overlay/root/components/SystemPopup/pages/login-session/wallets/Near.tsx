import { initBGFunctions } from 'chrome-extension-message-wrapper'
import * as React from 'react'
import browser from 'webextension-polyfill'
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
  error: string
  connected: boolean
  signing: boolean
  descriptor: WalletDescriptor | null
}

export default class Near extends React.Component<Props, State> {
  private _mounted = false

  constructor(props) {
    super(props)
    this.state = {
      error: null,
      connected: false,
      signing: false,
      descriptor: null,
    }
  }

  async componentDidMount() {
    this._mounted = true

    try {
      const {
        connectWallet,
        getWalletDescriptors,
        createLoginConfirmation,
        getSuitableLoginConfirmations,
      } = await initBGFunctions(browser)
      await connectWallet(this.props.chain, WalletTypes.NEAR, null)
      const descriptors = await getWalletDescriptors()
      const descriptor = descriptors.find(
        (x) => x.chain === this.props.chain && x.type === WalletTypes.NEAR
      )

      // sign message if required
      let confirmationId = undefined
      const { secureLogin, reusePolicy } = this.props.data.loginRequest
      const isItAboutSigning = secureLogin === 'required' && reusePolicy === 'manual'
      if (isItAboutSigning) {
        // ToDo: handle optional mode
        const confirmations = await getSuitableLoginConfirmations(
          this.props.data.app,
          this.props.data.loginRequest
        )

        // ToDo: similar code is in login-session/index.tsx
        const connectedWallets = descriptors
          .filter((x) => x.connected)
          .filter((x) => x.chain === this.props.chain)

        const validConfirmations = confirmations.filter(
          (x) => !!connectedWallets.find((y) => y.chain === x.authMethod && y.type === x.wallet)
        )

        if (validConfirmations.length > 0) {
          this.props.redirect('/login-confirmations')
          return
        }
        // ToDo ends

        const app = this.props.data.app
        const loginRequest = this.props.data.loginRequest
        const chain = this.props.chain
        const wallet = WalletTypes.NEAR
        const confirmation = await createLoginConfirmation(app, loginRequest, chain, wallet)
        confirmationId = confirmation.loginConfirmationId
      }

      if (this._mounted) {
        this.setState({ connected: true, descriptor })
        this.props.bus.publish('ready', [
          this.props.frameId,
          {
            wallet: WalletTypes.NEAR,
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
  }

  // async disconnect() {
  //     const { disconnectWallet } = await initBGFunctions(browser);
  //     await disconnectWallet(this.props.chain, WalletTypes.NEAR);
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
          title="MyNearWallet"
          subtitle="Please confirm signing in your wallet to continue"
          onBackButtonClick={this.goBack.bind(this)}
        />
      )

    if (!s.connected)
      return (
        <Loading
          title="MyNearWallet"
          subtitle="Please unlock your wallet to continue"
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
