import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import { useToken } from '../../../../../background/services/tokenomicsService/erc20Token'
import { ReactComponent as Copy } from '../../assets/icons/tokenomics/copy.svg'
import { regExpIndexEthereum } from '../../common/constants'
import { getValidationAddress } from '../../common/helpers'
import { Message } from '../../components/Message'
import { Modal } from '../../components/Modal'
import useCopied from '../../hooks/useCopyed'
import formatIconRefUrl from '../../utils/formatIconRefUrl'
import { NewToken } from './newToken'
import { RadioButtons } from './RadioButton/radioButtons'
import { SelectToken } from './selectToken'
import styles from './Tokenomics.module.scss'
export interface TokenomicsProps {
  setUnderConstructionDetails: (x) => void
  setTokenomics: (x) => void
  isSupport?: boolean
  ModuleInfo: any
}
enum ChoiseType {
  New = 0,
  Existing = 1,
}
export interface TokenInfo {
  name: string
  address: string
  symbol: string
  logoURI: string | null
  price?: string | number
  marketCup?: string | number
  trading?: string | number
}

export const Tokenomics: FC<TokenomicsProps> = (props) => {
  const { setUnderConstructionDetails, ModuleInfo, isSupport = true, setTokenomics } = props
  const [isNewToken, setNewToken] = useState(false)
  const [activeChoise, setActiveChoise] = useState(ChoiseType.New)
  const [isModal, setModal] = useState(false)
  const [isAnimate, setAnimate] = useState(false)
  const [selectToken, setSelectToken] = useState<TokenInfo>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [chooseToken, setChooseToken] = useState('')
  const onClose = () => setModal(false)
  const [daiInfo, setdaiInfo] = useState(null)
  const [mi, setMi] = useState<ModuleInfo>(ModuleInfo)
  const [TokensByApp, setTokensByApp] = useState(null)
  const [value, setValue] = useState('')
  const [, copy] = useCopied(value)
  const [isImg, setImg] = useState(false)
  useEffect(() => {
    const init = async () => {
      const { getTokensByApp } = await initBGFunctions(browser)
      const TokensByApp = await getTokensByApp(mi.name)

      setTokensByApp(TokensByApp)

      if (chooseToken) {
        const daiInfoN = await useToken(
          getValidationAddress(chooseToken, regExpIndexEthereum) !== null ? chooseToken : null
        )
        setdaiInfo(daiInfoN)
      }
    }
    init()
    return () => {}
  }, [chooseToken, selectToken])
  const handleSubmit = async (values) => {
    try {
      const { linkAppWithToken } = await initBGFunctions(browser)
      await linkAppWithToken(mi.name, values.address)
    } catch (e) {
      console.log(e)
    } finally {
    }
  }

  return (
    <>
      {!TokensByApp || TokensByApp.length === 0 ? (
        !isNewToken ? (
          <div className={styles.wrapper} ref={wrapperRef}>
            <div className={styles.blockMessage}>
              <Message
                title="Create new token or select existing?"
                subtitle="You can create a new token on the bonding curve with the ZOO ecosystem token as a collateral or use an existing ERC-20 token" // todo: mocked ecosystem
                parentPage="tokenomics"
                className={styles.messageWrapper}
                children={
                  <div className={styles.choiseTokenWrapper}>
                    <div className={styles.radioButtonsBlock}>
                      <RadioButtons
                        value="New token"
                        title="New token"
                        name="TokenChoise"
                        id="1_choise"
                        checked={activeChoise === ChoiseType.New}
                        onChange={() => {
                          setActiveChoise(ChoiseType.New)
                          setChooseToken('')
                          setSelectToken(null)
                        }}
                      />
                      <RadioButtons
                        value="Existing token"
                        title="Existing token"
                        name="TokenChoise"
                        id="2_choise"
                        checked={activeChoise === ChoiseType.Existing}
                        onChange={() => setActiveChoise(ChoiseType.Existing)}
                      />
                    </div>
                    {activeChoise === ChoiseType.Existing && (
                      <SelectToken
                        chooseToken={chooseToken}
                        setSelectToken={setSelectToken}
                        setChooseToken={setChooseToken}
                        selectToken={selectToken}
                        setAnimate={setAnimate}
                        daiInfo={daiInfo}
                      />
                    )}

                    <button
                      disabled={
                        activeChoise === ChoiseType.Existing &&
                        !selectToken &&
                        activeChoise === ChoiseType.Existing &&
                        !daiInfo
                      }
                      onClick={() => {
                        activeChoise === ChoiseType.New ? setNewToken(true) : setModal(true)
                      }}
                      className={styles.createTokenomics}
                    >
                      {activeChoise === ChoiseType.New ? 'Create new token' : 'Select token'}
                    </button>
                  </div>
                }
              />
            </div>
            <Modal
              classNameWrapper={styles.wraperModal}
              visible={isModal}
              title="Transaction Confirmation"
              content={
                <div className={styles.finalWarning}>
                  You are creating {daiInfo && daiInfo.name} {daiInfo && daiInfo.symbol} in GOERLY
                  network.
                  <br /> It will use a bonding curve with ZOO token as the collateral. This token
                  will be associated with your project {mi.name}.<br />
                  You won't be able to change this connection late
                </div>
              }
              footer={
                <div className={styles.footerContentModal}>
                  <button
                    className={cn(styles.footerContentModalButton)}
                    onClick={() => {
                      handleSubmit(daiInfo)
                    }}
                  >
                    Accept
                  </button>
                  {/* todo: correct src */}
                  <a
                    href="https://docs.dapplets.org/docs/whitepapers/auge-token-usage"
                    target="_blank"
                    className={styles.footerContentModalLink}
                  >
                    F.A.Q.
                  </a>
                </div>
              }
              onClose={onClose}
            />

            <div className={styles.linkNavigation}>
              <button onClick={() => setUnderConstructionDetails(false)} className={styles.back}>
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.wrapper} ref={wrapperRef}>
            <NewToken setNewToken={setNewToken} ModuleName={mi.name} />
          </div>
        )
      ) : (
        <div className={styles.wrapper}>
          <div className={styles.titleTokenApp}>
            Dapplet {mi.name.toUpperCase()} is connected to token
          </div>
          <div className={styles.blockTokenApp}>
            <div className={styles.firstLine}>
              {isImg ? (
                <div className={styles.icon}>{TokensByApp[0][0]}</div>
              ) : (
                <img
                  className={styles.icon}
                  onError={() => setImg(true)}
                  src={formatIconRefUrl(TokensByApp[0][5])}
                />
              )}
              <div className={styles.name}>{TokensByApp[0][1]}</div>
              <div className={styles.ticker}>{TokensByApp[0][0]}</div>
            </div>
            <div className={styles.secondLine}>
              <a
                onClick={() =>
                  window.open(`https://goerli.etherscan.io/address/${TokensByApp[0][2]}`, '_blank')
                }
                className={styles.address}
              >
                {TokensByApp[0][2]}
              </a>
              <span
                className={styles.tokenCopy}
                onClick={() => {
                  setValue(TokensByApp[0][2])
                  setTimeout(() => {
                    copy()
                  }, 500)
                }}
              >
                <Copy />
              </span>
            </div>
            {/* <div className={styles.thirdLine}>
             
              <div className={styles.blockRightInfo}>
                <span className={cn(styles.infoValue)}>n/a</span>
                <span
                  className={cn(styles.infoPercent, {
                    [styles.infoPercentHight]: false,
                  })}
                >
                  price
                </span>
              </div>
              <div className={styles.blockRightInfo}>
                <span className={styles.infoValue}>n/a</span>
                <span className={styles.infoName}>market cap</span>
              </div>
              <div className={styles.blockRightInfo}>
                <span className={styles.infoValue}>n/a</span>
                <span className={styles.infoName}>24H trading vol</span>
              </div>
            </div> */}
          </div>
          <div className={styles.linkNavigation} style={{ marginTop: 'auto' }}>
            <button onClick={() => setUnderConstructionDetails(false)} className={styles.back}>
              Back
            </button>
          </div>
        </div>
      )}
    </>
  )
}
