import React, { useState, useEffect, FC } from 'react'
import cn from 'classnames'
import styles from './Tokenomics.module.scss'
import { SettingWrapper } from '../../components/SettingWrapper'
import { SettingItem } from '../../components/SettingItem'

import { Message } from '../../components/Message'
import { Modal } from '../../components/Modal'

export interface TokenomicsProps {
  setUnderConstructionDetails: (x) => void
  setTokenomics: (x) => void
  isSupport?: boolean
}

let _isMounted = false

export const Tokenimics: FC<TokenomicsProps> = (props) => {
  const { setUnderConstructionDetails, isSupport = true, setTokenomics } = props
  const [isCreate, SetCreate] = useState(false)
  const [tokenName, setTokenName] = useState('')
  const [tokenListing, setTokenListing] = useState('')

  const [isModal, setModal] = useState(false)
  const [isInvalidTokenTicker, setInvalidTokenTicker] = useState(false)
  const [isInvalidTokenName, setInvalidTokenName] = useState(false)
  const onClose = () => setModal(false)
  const [visibleConfirm, setVisibleConfirm] = useState(true)

  useEffect(() => {}, [
    tokenListing,
    tokenName,
    isInvalidTokenTicker,
    isInvalidTokenName,
    visibleConfirm,
  ])
  return (
    <div className={styles.wrapper}>
      {!isCreate && (
        <div className={styles.blockMessage}>
          <Message
            title="Do you want to connect tokenomics?"
            subtitle="Be careful - this can only be done once"
            link="F.A.Q"
            linkText="F.A.Q"
            children={
              <button
                onClick={() => SetCreate(true)}
                className={styles.createTokenomics}
              >
                CREATE
              </button>
            }
          />
        </div>
      )}
      {isCreate && (
        <div className={styles.blockTokenParameters}>
          <SettingWrapper
            title="Token parameters"
            className={styles.wrapperSettings}
            children={
              <div className={styles.blockTokenInfo}>
                <SettingItem
                  className={styles.titleToken}
                  title="Token Name"
                  component={
                    <span
                      data-title="for ex. - Ethereum, Tether, AugmentedWeb."
                      className={cn(styles.tokenTitleInfo, {
                        [styles.support]: isSupport,
                      })}
                    >
                      i
                    </span>
                  }
                  children={
                    <input
                      placeholder="Enter token name"
                      className={cn(styles.inputTokenName, {
                        [styles.inputTokenTickerInvalid]: isInvalidTokenName,
                      })}
                      value={tokenName}
                      onChange={(e) => {
                        setTokenName(e.target.value)
                        if (tokenName.length < 1 || tokenName.length > 16) {
                          setInvalidTokenName(true)
                        } else {
                          setInvalidTokenName(false)
                        }
                      }}
                      onFocus={() => setInvalidTokenName(false)}
                    />
                  }
                />
                <SettingItem
                  title="Token Ticker"
                  className={styles.titleToken}
                  component={
                    <span
                      style={{ margin: '0 0 0 1px' }}
                      data-title="for ex. - ETH, USDT, AUGE"
                      className={cn(styles.tokenTitleInfo, {
                        [styles.support]: isSupport,
                      })}
                    >
                      i
                    </span>
                  }
                  children={
                    <input
                      placeholder="Enter token name"
                      className={cn(
                        styles.inputTokenName,
                        styles.inputTokenTicker,
                        {
                          [styles.inputTokenTickerInvalid]:
                            isInvalidTokenTicker,
                        }
                      )}
                      value={tokenListing}
                      onFocus={() => setInvalidTokenTicker(false)}
                      onChange={(e) => {
                        setTokenListing(e.target.value)

                        if (
                          e.target.value.length <= 2 ||
                          e.target.value.length >= 5
                        ) {
                          setInvalidTokenTicker(true)
                        } else {
                          setInvalidTokenTicker(false)
                        }
                      }}
                    />
                  }
                />
              </div>
            }
          />
          {visibleConfirm && (
            <button
              disabled={
                !(
                  tokenName.length >= 1 &&
                  tokenListing.length >= 1 &&
                  !isInvalidTokenName &&
                  !isInvalidTokenTicker
                )
              }
              className={cn(styles.applyButtonDisabled, {
                [styles.createTokenomics]:
                  tokenName.length >= 1 &&
                  tokenListing.length >= 1 &&
                  !isInvalidTokenName &&
                  !isInvalidTokenTicker,
              })}
              onClick={() => setModal(true)}
            >
              Confirm
            </button>
          )}

          <Modal
            visible={isModal}
            title="Create Tokenomy"
            content={
              <div className={styles.finalWarning}>
                China's final warning - you can't change it anymore
              </div>
            }
            footer={
              <div className={styles.footerContentModal}>
                <button
                  className={cn(styles.footerContentModalButton)}
                  onClick={() => {
                    onClose()
                    setTokenomics(true)
                    setVisibleConfirm(false)
                  }}
                >
                  Yes, i'm super sure
                </button>
                <a className={styles.footerContentModalLink}>F.A.Q.</a>
              </div>
            }
            onClose={onClose}
          />
        </div>
      )}

      <div className={styles.linkNavigation}>
        <button
          onClick={() => setUnderConstructionDetails(false)}
          className={styles.back}
        >
          Back
        </button>
      </div>
    </div>
  )
}
