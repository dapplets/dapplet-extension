import React, {
  ReactElement,
  useState,
  useEffect,
  useMemo,
  FC,
  useRef,
} from 'react'
import cn from 'classnames'
import styles from './Tokenomics.module.scss'
import { SettingWrapper } from '../../components/SettingWrapper'
import { SettingItem } from '../../components/SettingItem'
import {
  isValidHttp,
  isValidUrl,
  isValidPostageStampId,
} from '../../../../../popup/helpers'
import { browser } from 'webextension-polyfill-ts'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { useToggle } from '../../hooks/useToggle'
import { Bus } from '../../../../../common/bus'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
import * as tracing from '../../../../../common/tracing'
import { ChainTypes, DefaultSigners } from '../../../../../common/types'
import { typeOfUri, chainByUri, joinUrls } from '../../../../../common/helpers'
import { StorageRefImage } from '../../components/DevModulesList'
import { Message } from '../../components/Message'
import { Modal } from '../../components/Modal'
import {
  DEFAULT_BRANCH_NAME,
  ModuleTypes,
  StorageTypes,
} from '../../../../../common/constants'

export interface TokenomicsProps {
  setUnderConstructionDetails: (x) => void
  isSupport?: boolean
}
let _isMounted = false
export const Tokenimics: FC<TokenomicsProps> = (props) => {
  const { setUnderConstructionDetails, isSupport = true } = props
  const [isCreate, SetCreate] = useState(false)

  const [isModal, setModal] = useState(false)
  const onClose = () => setModal(false)
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
                      className={styles.inputTokenName}
                      onChange={(e) => e.target.value}
                    />
                  }
                />
                <SettingItem
                  title="Token Listing"
                  className={styles.titleToken}
                  component={
                    <span
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
                      className={styles.inputTokenName}
                      onChange={(e) => e.target.value}
                    />
                  }
                />
              </div>
            }
          />
          <button
            onClick={() => setModal(true)}
            className={styles.createTokenomics}
          >
            Confirm
          </button>
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
                  className={styles.footerContentModalButton}
                  onClick={onClose}
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
