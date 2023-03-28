import { initBGFunctions } from 'chrome-extension-message-wrapper'
import makeBlockie from 'ethereum-blockies-base64'
import React, { FC, useEffect, useState } from 'react'
import ReactTimeAgo from 'react-time-ago'
import { browser } from 'webextension-polyfill-ts'
import * as EventBus from '../../../../../common/global-event-bus'
import * as walletIcons from '../../../../../common/resources/wallets'
import {
  ChainTypes,
  DefaultSigners,
  WalletDescriptor,
  WalletTypes,
} from '../../../../../common/types'

export interface WalletProps {
  isOverlay?: boolean
  handleWalletLengthConnect?: () => void
}

export const Wallet: FC<WalletProps> = (props: WalletProps) => {
  const { isOverlay, handleWalletLengthConnect } = props
  const [descriptors, setDescriptors] = useState<WalletDescriptor[]>([])
  const [loading, setLoading] = useState(true)

  const connectedDescriptors = descriptors.filter((x) => x.connected)
  useEffect(() => {
    const init = async () => {
      refresh()

      EventBus.on('wallet_changed', refresh)
    }

    init()

    return () => {
      EventBus.off('wallet_changed', refresh)
    }
  }, [])
  const refresh = async () => {
    const { getWalletDescriptors } = await initBGFunctions(browser)

    const descriptors = await getWalletDescriptors()

    setDescriptors(descriptors)
    setLoading(false)
  }

  const disconnectButtonClick = async (chain: ChainTypes, wallet: WalletTypes) => {
    const { disconnectWallet } = await initBGFunctions(browser)
    await disconnectWallet(chain, wallet)
  }

  const connectWallet = async () => {
    const { pairWalletViaOverlay } = await initBGFunctions(browser)
    if (isOverlay) {
      await pairWalletViaOverlay(null, DefaultSigners.EXTENSION, null)

      handleWalletLengthConnect()
    } else {
      pairWalletViaOverlay(null, DefaultSigners.EXTENSION, null)
      handleWalletLengthConnect()
    }
  }

  if (loading) return null

  return (
    <React.Fragment>
      <div
        className={isOverlay ? undefined : 'internalTab'}
        style={{ marginTop: isOverlay ? 0 : undefined }}
      >
        {connectedDescriptors.length > 0 ? (
          <div>
            {/* ToDo: here was <Comment.Group> */}
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
                    {x.account ? (
                      <span title={x.account} style={{ color: '#000', fontWeight: 'bold' }}>
                        {x.account.length === 42
                          ? x.account.substr(0, 6) + '...' + x.account.substr(38)
                          : x.account}
                      </span>
                    ) : null}
                    {/* 
                    // ToDo: restore it
                    <CheckIcon
                      text="Copied"
                      name="copy"
                      style={{ marginLeft: '4px' }}
                      onClick={() => navigator.clipboard.writeText(x.account)}
                    /> */}
                  </div>
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
                  </div>
                </div>
                <div>
                  {/* ToDo: Here was semantic-ui <Button> */}
                  <button
                    onClick={() => disconnectButtonClick(x.chain, x.type)}
                    // size="tiny"
                    style={{ margin: '5px 0' }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
            {/* ToDo: here was </Comment.Group> */}
          </div>
        ) : (
          <div style={{ marginBottom: '10px' }}>No connected wallets</div>
        )}

        {/* ToDo: Here was semantic-ui <Button> */}
        <button onClick={() => connectWallet()}>Connect</button>
      </div>
    </React.Fragment>
  )
}
