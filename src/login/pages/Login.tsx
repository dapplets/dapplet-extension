import { initBGFunctions } from 'chrome-extension-message-wrapper'
import makeBlockie from 'ethereum-blockies-base64'
import * as React from 'react'
import ReactTimeAgo from 'react-time-ago'
import { Button, Comment, Header, Icon, Message } from 'semantic-ui-react'
import { browser } from 'webextension-polyfill-ts'
import { Account, DomainTypes } from '../../background/services/identityService'
import { Bus } from '../../common/bus'
import { CheckIcon } from '../../common/react-components/CheckIcon'
import * as walletIcons from '../../common/resources/wallets'
import { ChainTypes, WalletDescriptor } from '../../common/types'
import { ProfileCard } from '../component/ProfileCard'

interface Props {
  account: {
    username: string
    fullname: string
    img: string
    domainId: number
  }
  app: string
  chain: ChainTypes
  bus: Bus
}

interface State {
  loading: boolean
  descriptors: (WalletDescriptor & { relatedIdentities: Account[] })[]
}

export class Login extends React.Component<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      descriptors: [],
    }
  }

  async componentDidMount() {
    await this.loadData()
  }

  async loadData() {
    const p = this.props
    const { getWalletDescriptors, getIdentityAccounts } = await initBGFunctions(browser)
    const descriptors: WalletDescriptor[] = await getWalletDescriptors()
    const descriptorsAndIdentities: (WalletDescriptor & { relatedIdentities: Account[] })[] =
      await Promise.all(
        descriptors
          .filter((x) => x.connected && x.account)
          .map((x) =>
            getIdentityAccounts({
              domainId: DomainTypes.Ethereum,
              name: x.account.toLowerCase(),
            }).then((y) => ({ ...x, relatedIdentities: y }))
          )
      )
    const suitable = descriptorsAndIdentities.filter((x) =>
      x.relatedIdentities.find(
        (y) =>
          y.domainId === p.account.domainId &&
          y.name.toLowerCase() === p.account.username.toLowerCase()
      )
    )

    this.setState({
      descriptors: suitable,
      loading: false,
    })
  }

  async selectWallet(wallet: string) {
    const { setWalletFor } = await initBGFunctions(browser)
    const { app } = this.props
    await setWalletFor(wallet, app, ChainTypes.ETHEREUM_GOERLI)
    this.props.bus.publish('ready')
    await this.componentDidMount()
  }

  async pairWallet() {
    const { app } = this.props
    const { pairWalletViaOverlay } = await initBGFunctions(browser)
    await pairWalletViaOverlay(ChainTypes.ETHEREUM_GOERLI, app, null)
    await this.loadData()
  }

  render() {
    if (this.state.loading) return null

    const connectedWallets = this.state.descriptors.filter((x) => x.connected)
    const disconnectedWallets = this.state.descriptors.filter((x) => !x.connected)

    return (
      <div style={{ padding: '30px 20px' }}>
        <Message
          warning
          header="Experimental Feature"
          content="Authorization with account tuples is in the development stage. Please do not utilize this feature in production."
        />

        <Header as="h3">Login to your account</Header>
        <ProfileCard account={this.props.account} />

        {connectedWallets.length > 0 ? (
          <>
            <Header as="h3">using other account of this Account Group...</Header>
            <Comment.Group>
              {connectedWallets.map((x, i) => (
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
                          {x.account.substr(0, 6) + '...' + x.account.substr(38)}
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
                      primary
                      onClick={() => this.selectWallet(x.type)}
                      size="tiny"
                      style={{ margin: '5px 0' }}
                    >
                      Login
                    </Button>
                  </div>
                </div>
              ))}

              <Message info>
                <p>Don't see your account here? You can:</p>
                <Message.List>
                  <Message.Item>change an active account in a connected wallet</Message.Item>
                  <Message.Item>
                    connect a new wallet{' '}
                    <Icon name="chain" link onClick={() => this.pairWallet()} />
                  </Message.Item>
                  <Message.Item>link your account to the Account Group</Message.Item>
                  <Message.Item>select another Account Group</Message.Item>
                </Message.List>
              </Message>
            </Comment.Group>
          </>
        ) : (
          <Message warning>
            <p>
              No one of connected wallets is eligible to sign on behalf of the account you selected.
            </p>
            <p>You can:</p>
            <Message.List>
              <Message.Item>change an active account in a connected wallet</Message.Item>
              <Message.Item>
                connect a new wallet <Icon name="chain" link onClick={() => this.pairWallet()} />
              </Message.Item>
              <Message.Item>link your account to the Account Group</Message.Item>
              <Message.Item>select another Account Group</Message.Item>
            </Message.List>
          </Message>
        )}
      </div>
    )
  }
}
