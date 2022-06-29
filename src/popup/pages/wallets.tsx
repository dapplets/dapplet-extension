import { initBGFunctions } from 'chrome-extension-message-wrapper'
import makeBlockie from 'ethereum-blockies-base64'
import * as React from 'react'
import ReactTimeAgo from 'react-time-ago'
import { Button, Comment, Segment } from 'semantic-ui-react'
import { browser } from 'webextension-polyfill-ts'
import * as EventBus from '../../common/global-event-bus'
import { CheckIcon } from '../../common/react-components/CheckIcon'
import * as walletIcons from '../../common/resources/wallets'
import { ChainTypes, DefaultSigners, WalletDescriptor, WalletTypes } from '../../common/types'

interface IWalletsProps {
  isOverlay: boolean
}

interface IWalletsState {
  descriptors: WalletDescriptor[]
  //walletInfo: WalletInfo;
  loading: boolean
}

class Wallets extends React.Component<IWalletsProps, IWalletsState> {
  private _isMounted = false

  constructor(props) {
    super(props)

    this.state = {
      descriptors: [],
      loading: true,
    }
  }

  async componentDidMount() {
    this.refresh()
    this._isMounted = true
    EventBus.on('wallet_changed', this.refresh)
  }

  componentWillUnmount() {
    this._isMounted = false
    EventBus.off('wallet_changed', this.refresh)
  }

  refresh = async () => {
    const { getWalletDescriptors } = await initBGFunctions(browser)

    const descriptors = await getWalletDescriptors()

    if (this._isMounted) {
      this.setState({
        descriptors: descriptors,
        loading: false,
      })
    }
  }

  async disconnectButtonClick(chain: ChainTypes, wallet: WalletTypes) {
    const { disconnectWallet } = await initBGFunctions(browser)
    await disconnectWallet(chain, wallet)
    await this.componentDidMount()
  }

  async connectWallet() {
    const { pairWalletViaOverlay } = await initBGFunctions(browser)
    if (this.props.isOverlay) {
      await pairWalletViaOverlay(null, DefaultSigners.EXTENSION, null)
      await this.componentDidMount()
    } else {
      pairWalletViaOverlay(null, DefaultSigners.EXTENSION, null)
      window.close()
    }
  }

  async setWalletFor(type: string) {
    const { setWalletFor } = await initBGFunctions(browser)
    await setWalletFor(type, DefaultSigners.EXTENSION, ChainTypes.ETHEREUM_GOERLI)
    await this.componentDidMount()
  }

  render() {
    const { descriptors, loading } = this.state

    if (loading) return null

    const connectedDescriptors = descriptors.filter((x) => x.connected)

    return (
      <React.Fragment>
        <Segment
          className={this.props.isOverlay ? undefined : 'internalTab'}
          style={{ marginTop: this.props.isOverlay ? 0 : undefined }}
        >
          {connectedDescriptors.length > 0 ? (
            <Comment.Group>
              {connectedDescriptors.map((x, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: '10px',
                    display: 'flex',
                    boxShadow: '0 0 0 1px rgba(34,36,38,.15) inset',
                    borderRadius: '.28571429rem',
                    padding: '.78571429em 1.5em .78571429em',
                  }}
                >
                  {x.account ? (
                    <img
                      src={makeBlockie(x.account)}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '4px',
                        margin: '2px 0',
                      }}
                    />
                  ) : null}
                  <div style={{ flex: 'auto', marginLeft: '10px' }}>
                    <div style={{ display: 'inline', color: 'rgba(0,0,0,.4)' }}>
                      {/* {(x.default) ? <Icon name='star' /> : <Icon link name='star outline' onClick={() => this.setWalletFor(x.type)} />} */}
                      {x.account ? (
                        <span title={x.account} style={{ color: '#000', fontWeight: 'bold' }}>
                          {x.account.length === 42
                            ? x.account.substr(0, 6) + '...' + x.account.substr(38)
                            : x.account}
                        </span>
                      ) : null}
                      <CheckIcon
                        text="Copied"
                        name="copy"
                        style={{ marginLeft: '4px' }}
                        onClick={() => navigator.clipboard.writeText(x.account)}
                      />
                    </div>
                    {/* <Comment.Author style={{ display: 'inline' }}>{x.account}</Comment.Author> */}
                    {/* <Icon link name='external' onClick={() => window.open(`https://${(x.chainId === 1) ? '' : networkName(x.chainId) + '.'}etherscan.io/address/${x.account}`, '_blank')} /> */}
                    <div>
                      {walletIcons[x.type] ? (
                        <img
                          style={{ width: '16px', position: 'relative', top: '3px' }}
                          src={walletIcons[x.type]}
                        />
                      ) : null}
                      {x.meta?.icon ? (
                        <img
                          style={{
                            width: '16px',
                            position: 'relative',
                            top: '3px',
                            marginLeft: '3px',
                          }}
                          src={x.meta.icon}
                        />
                      ) : null}
                      {x.lastUsage ? (
                        <span style={{ marginLeft: '6px', color: 'rgba(0,0,0,.4)' }}>
                          <ReactTimeAgo date={new Date(x.lastUsage)} locale="en-US" />
                        </span>
                      ) : null}
                      {/* <span style={{ marginLeft: '0.5em' }}>{networkName(x.chainId)}</span> */}
                    </div>
                  </div>
                  <div>
                    <Button
                      onClick={() => this.disconnectButtonClick(x.chain, x.type)}
                      size="tiny"
                      style={{ margin: '5px 0' }}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </Comment.Group>
          ) : (
            <div style={{ marginBottom: '10px' }}>No connected wallets</div>
          )}

          <Button onClick={() => this.connectWallet()}>Connect</Button>
        </Segment>
      </React.Fragment>
    )
  }
}

export default Wallets
