import { initBGFunctions } from 'chrome-extension-message-wrapper'
import * as React from 'react'
import { Navigate } from 'react-router-dom'
import { Button, Loader, Segment } from 'semantic-ui-react'
import { browser } from 'webextension-polyfill-ts'
import { Bus } from '../../common/bus'
import { ChainTypes, WalletDescriptor, WalletTypes } from '../../common/types'

interface Props {
  bus: Bus
  chain: ChainTypes
}

interface State {
  error: string
  connected: boolean
  toBack: boolean
  descriptor: WalletDescriptor | null
}

export default class extends React.Component<Props, State> {
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
    try {
      const { connectWallet, getWalletDescriptors } = await initBGFunctions(browser)
      await connectWallet(this.props.chain, WalletTypes.NEAR, null)
      const descriptors = await getWalletDescriptors()
      const descriptor = descriptors.find(
        (x) => x.chain === this.props.chain && x.type === WalletTypes.NEAR
      )
      this.setState({ connected: true, descriptor })
    } catch (err) {
      console.error(err)
      this.setState({ error: err.message })
    }
  }

  async disconnect() {
    const { disconnectWallet } = await initBGFunctions(browser)
    await disconnectWallet(this.props.chain, WalletTypes.NEAR)
    this.setState({ toBack: true })
  }

  async continue() {
    this.props.bus.publish('ready')
  }

  render() {
    const s = this.state

    if (s.toBack === true) {
      return <Navigate to="/" />
    }

    if (s.error)
      return (
        <>
          <h3>Error</h3>
          <p>{s.error}</p>
          <Button onClick={() => this.setState({ toBack: true })}>Back</Button>
        </>
      )

    if (!s.connected)
      return (
        <>
          <Loader active inline="centered">
            Please unlock your wallet to continue
          </Loader>
        </>
      )

    if (s.connected)
      return (
        <>
          <h3>Connected</h3>
          <p>The wallet is connected</p>
          {s.descriptor.meta ? (
            <Segment style={{ textAlign: 'center' }}>
              <img
                src={s.descriptor.meta.icon}
                alt={s.descriptor.meta.name}
                style={{ width: '64px' }}
              />
              <div style={{ fontWeight: 'bold', fontSize: '1.3em' }}>{s.descriptor.meta.name}</div>
              <div>{s.descriptor.meta.description}</div>
              <div>{s.descriptor.account}</div>
            </Segment>
          ) : null}
          <div style={{ marginTop: '15px' }}>
            <Button onClick={() => this.disconnect()}>Disconnect</Button>
            <Button primary onClick={() => this.continue()}>
              Continue
            </Button>
          </div>
        </>
      )
  }
}
