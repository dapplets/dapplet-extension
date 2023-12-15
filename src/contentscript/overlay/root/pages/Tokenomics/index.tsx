import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useMemo, useRef, useState } from 'react'
import browser from 'webextension-polyfill'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import { ReactComponent as Copy } from '../../assets/icons/tokenomics/copy.svg'
import { regExpIndexEthereum } from '../../common/constants'
import { getValidationAddress } from '../../common/helpers'
import { Message } from '../../components/Message'
import { Modal } from '../../components/Modal'
import { TabLoader } from '../../components/TabLoader'
import useCopied from '../../hooks/useCopyed'
import formatIconRefUrl from '../../utils/formatIconRefUrl'
import { DappletsDetails, UnderConstructionDetails } from '../Settings'
import { NewToken } from './newToken'
import { RadioButtons } from './RadioButton/radioButtons'
import { SelectToken } from './selectToken'
import styles from './Tokenomics.module.scss'

export interface TokenomicsProps {
  setPageDetails: (x: boolean) => void
  isSupport?: boolean
  ModuleInfo: any
  setActiveTab: any
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
type Message = {
  type: 'negative' | 'positive'
  header: string
  message: string[]
}

export const Tokenomics: FC<TokenomicsProps> = (props) => {
  const { setPageDetails, ModuleInfo, isSupport = true, setActiveTab } = props
  const [isNewToken, setNewToken] = useState(false)
  const [activeChoise, setActiveChoise] = useState(ChoiseType.New)
  const [isModal, setModal] = useState(false)
  const [isAnimate, setAnimate] = useState(false)
  const [selectToken, setSelectToken] = useState<TokenInfo>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [chooseToken, setChooseToken] = useState('')

  const [daiInfo, setdaiInfo] = useState(null)
  const [mi, setMi] = useState<ModuleInfo>(ModuleInfo)
  const [tokensByApp, setTokensByApp] = useState(null)
  const [value, setValue] = useState('')
  const [, copy] = useCopied(value)
  const [isImg, setImg] = useState(false)
  const [isModalTransaction, setModalTransaction] = useState(false)
  const [isModalEndCreation, setModalEndCreation] = useState(false)
  const [message, setMessage] = useState<Message>(null)
  const [isModalError, setModalError] = useState(false)

  const [isLoad, setLoad] = useState(false)
  const onClose = () => setModal(false)
  const onCloseError = () => {
    setModalError(false)
    setMessage(null)
  }

  useEffect(() => {
    const init = async () => {
      setLoad(true)
      await _updateData()
      setLoad(false)
    }
    init()
    return () => {}
  }, [])

  const _updateData = async () => {
    const { getTokensByApp } = await initBGFunctions(browser)

    const tokensByApp = await getTokensByApp(mi.name)

    setTokensByApp(tokensByApp)
  }
  const handleSubmit = async (values) => {
    try {
      setModalTransaction(true)
      const { linkAppWithToken } = await initBGFunctions(browser)
      await linkAppWithToken(mi.name, values.address)
      setModalTransaction(false)
      setModalEndCreation(true)
    } catch (e) {
      setMessage({
        type: 'negative',
        header: 'Transaction error',
        message: [e.message],
      })
      setModalError(true)
    } finally {
      setModalTransaction(false)
    }
  }

  const tokenCreated = useMemo(() => {
    setTokensByApp(tokensByApp)
    return tokensByApp
  }, [tokensByApp])
  const _updatePage = async () => {
    setModalEndCreation(false)

    setActiveTab(
      ModuleInfo.isUnderConstruction ? UnderConstructionDetails.INFO : DappletsDetails.MAININFO
    )
  }
  return (
    <>
      {' '}
      {isLoad ? (
        <TabLoader isGrayPageColor />
      ) : (
        <>
          {!tokenCreated || tokenCreated.length === 0 ? (
            !isNewToken ? (
              <div className={styles.wrapper} ref={wrapperRef}>
                <div className={styles.blockMessage}>
                  <Message
                    title="Create new token or select existing?"
                    subtitle="You can create a new token on the bonding curve with the ZOO ecosystem token as a collateral or use an existing ERC-20 token" // todo: mocked ecosystem
                    otherSubtitle
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
                              setdaiInfo(null)
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
                            setdaiInfo={setdaiInfo}
                          />
                        )}

                        <button
                          disabled={
                            activeChoise === ChoiseType.Existing &&
                            getValidationAddress(chooseToken, regExpIndexEthereum) === null &&
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
                  visible={isModal && daiInfo}
                  title="Transaction Confirmation"
                  content={
                    <div className={styles.finalWarning}>
                      You are associate token {daiInfo && daiInfo.name} to your project {mi.name}
                      <br />
                      You won&#39;t be able to change this connection late
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
                        rel="noreferrer"
                      >
                        F.A.Q.
                      </a>
                    </div>
                  }
                  onClose={onClose}
                />
                <Modal
                  visible={isModalTransaction}
                  title={'Transaction started'}
                  content={''}
                  footer={''}
                  onClose={() => !isModalTransaction}
                />
                <Modal
                  visible={isModalEndCreation}
                  title={'Transaction finished'}
                  content={''}
                  footer={''}
                  onClose={() => _updatePage()}
                />
                {message ? (
                  <Modal
                    visible={isModalError}
                    title={message.header}
                    content={
                      <div className={styles.modalDefaultContent}>
                        {message.message.map((m, i) => (
                          <p key={i} style={{ overflowWrap: 'break-word' }}>
                            {m === `Cannot read properties of null (reading 'length')`
                              ? 'Please fill in the empty fields'
                              : m}
                          </p>
                        ))}
                      </div>
                    }
                    footer={''}
                    onClose={() => onCloseError()}
                  />
                ) : null}
                <div className={styles.linkNavigation}>
                  <button onClick={() => setPageDetails(false)} className={styles.back}>
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.wrapper} ref={wrapperRef}>
                <NewToken setNewToken={setNewToken} module={mi} setActiveTab={setActiveTab} />
              </div>
            )
          ) : (
            <div className={styles.wrapper}>
              <div className={styles.titleTokenApp}>Dapplet {mi.name} is connected to token</div>
              <div className={styles.blockTokenApp}>
                <div className={styles.firstLine}>
                  {isImg ? (
                    <div className={styles.icon}>{tokenCreated[0][0]}</div>
                  ) : (
                    <img
                      className={styles.icon}
                      onError={() => setImg(true)}
                      src={formatIconRefUrl(tokenCreated[0][5])}
                    />
                  )}
                  <div className={styles.name}>{tokenCreated[0][1]}</div>
                  <div className={styles.ticker}>{tokenCreated[0][0]}</div>
                </div>
                <div className={styles.secondLine}>
                  <a
                    onClick={() =>
                      window.open(
                        `https://sepolia.etherscan.io/address/${tokenCreated[0][2]}`,
                        '_blank'
                      )
                    }
                    className={styles.address}
                  >
                    {tokenCreated[0][2]}
                  </a>
                  <span
                    className={styles.tokenCopy}
                    onClick={() => {
                      setValue(tokenCreated[0][2])
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
                <button onClick={() => setPageDetails(false)} className={styles.back}>
                  Back
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
