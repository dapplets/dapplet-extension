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
  descriptor: WalletDescriptor | null
}

export default class Dapplets extends React.Component<Props, State> {
  private _mounted = false

  constructor(props) {
    super(props)
    this.state = {
      error: null,
      connected: false,
      descriptor: null,
    }
  }

  async componentDidMount() {
    this._mounted = true

    try {
      const { connectWallet, getWalletDescriptors, createLoginConfirmation } =
        await initBGFunctions(browser)

      // connect wallet
      await connectWallet(this.props.chain, WalletTypes.DAPPLETS, null)
      const descriptors = await getWalletDescriptors()
      const descriptor = descriptors.find((x) => x.type === 'dapplets')

      // sign message if required
      let confirmationId = undefined
      const { secureLogin, reusePolicy } = this.props.data.loginRequest
      const isItAboutSigning = secureLogin === 'required' && reusePolicy === 'manual'
      if (isItAboutSigning) {
        const app = this.props.data.app
        const loginRequest = this.props.data.loginRequest
        const chain = this.props.chain
        const wallet = WalletTypes.DAPPLETS
        const confirmation = await createLoginConfirmation(app, loginRequest, chain, wallet)
        confirmationId = confirmation.loginConfirmationId
      }

      if (this._mounted) {
        this.setState({ connected: true, descriptor })
        this.props.bus.publish('ready', [
          this.props.frameId,
          {
            wallet: WalletTypes.DAPPLETS,
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
  //     await disconnectWallet(this.props.chain, WalletTypes.DAPPLETS);
  //     this.setState({ toBack: true });
  // }

  async continue() {
    this.props.bus.publish('ready', [
      this.props.frameId,
      {
        wallet: WalletTypes.DAPPLETS,
        chain: this.props.chain,
      },
    ])
  }

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

    if (!s.connected)
      return (
        <Loading
          title="Built-in Wallet"
          subtitle="Generating a private key"
          onBackButtonClick={this.goBack.bind(this)}
        />
      )

    return null

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
  }
}
