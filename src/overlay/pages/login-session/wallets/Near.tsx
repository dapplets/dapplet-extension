import { initBGFunctions } from 'chrome-extension-message-wrapper'
import * as React from 'react'
import { Navigate } from 'react-router-dom'
import { browser } from 'webextension-polyfill-ts'
import { Bus } from '../../../../common/bus'
import { ChainTypes, LoginRequest, WalletDescriptor, WalletTypes } from '../../../../common/types'
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
}

interface State {
  error: string
  connected: boolean
  toBack: boolean
  descriptor: WalletDescriptor | null
}

export default class extends React.Component<Props, State> {
  private _mounted = false

  constructor(props) {
    super(props)
    this.state = {
      error: null,
      connected: false,
      toBack: false,
      descriptor: null,
    }
  }

  async componentDidMount() {
    this._mounted = true

    try {
      const { connectWallet, getWalletDescriptors } = await initBGFunctions(browser)
      await connectWallet(this.props.chain, WalletTypes.NEAR, null)
      const descriptors = await getWalletDescriptors()
      const descriptor = descriptors.find(
        (x) => x.chain === this.props.chain && x.type === WalletTypes.NEAR
      )

      // sign message if required
      const secureLogin = this.props.data.loginRequest.secureLogin
      if (secureLogin === 'required') {
        throw new Error("NEAR Wallet doesn't support message signing.")
      }

      if (this._mounted) {
        this.setState({ connected: true, descriptor })
        this.continue()
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

  async continue() {
    this.props.bus.publish('ready', [
      this.props.frameId,
      {
        wallet: WalletTypes.NEAR,
        chain: this.props.chain,
      },
    ])
  }

  render() {
    const s = this.state

    if (s.toBack === true) {
      return <Navigate to="/pairing" />
    }

    if (s.error)
      return (
        <Loading
          title="Error"
          subtitle={s.error}
          content={<div></div>}
          onBackButtonClick={() => this.setState({ toBack: true })}
        />
      )

    if (!s.connected)
      return (
        <Loading
          title="NEAR Wallet"
          subtitle="Please unlock your wallet to continue"
          onBackButtonClick={() => this.setState({ toBack: true })}
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
