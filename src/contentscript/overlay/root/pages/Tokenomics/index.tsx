import cn from 'classnames'
import React, { FC, useRef, useState } from 'react'
import { Message } from '../../components/Message'
import { Modal } from '../../components/Modal'
import { NewToken } from './newToken'
import { RadioButtons } from './RadioButton/radioButtons'
import { SelectToken } from './selectToken'
import styles from './Tokenomics.module.scss'

export interface TokenomicsProps {
  setUnderConstructionDetails: (x) => void
  setTokenomics: (x) => void
  isSupport?: boolean
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
  const { setUnderConstructionDetails, isSupport = true, setTokenomics } = props
  const [isNewToken, setNewToken] = useState(false)
  const [activeChoise, setActiveChoise] = useState(ChoiseType.New)
  const [isModal, setModal] = useState(false)
  const [isAnimate, setAnimate] = useState(false)
  const [selectToken, setSelectToken] = useState<TokenInfo>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const onClose = () => setModal(false)

  // useEffect(() => {
  //   const init = () => {
  //     anime({
  //       targets: wrapperRef.current,
  //       translateX: () => {
  //         if (isAnimate) {
  //           return ['100%', '0%']
  //         }
  //       },
  //       easing: 'linear',
  //       duration: 300,
  //     })
  //   }
  //   init()
  //   return () => {}
  // }, [isAnimate, wrapperRef])

  return (
    <>
      {!isNewToken ? (
        <div className={styles.wrapper} ref={wrapperRef}>
          <div className={styles.blockMessage}>
            <Message
              title="Create new token or select existing?"
              subtitle="Be careful - this can only be done once"
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
                      setSelectToken={setSelectToken}
                      selectToken={selectToken}
                      setAnimate={setAnimate}
                    />
                  )}

                  <button
                    disabled={activeChoise === ChoiseType.Existing && !selectToken}
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
            title="Are you sure?"
            content={
              <div className={styles.finalWarning}>Final warning - you can't change it anymore</div>
            }
            footer={
              <div className={styles.footerContentModal}>
                <button
                  className={cn(styles.footerContentModalButton)}
                  onClick={() => {
                    onClose()
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
          <NewToken  />
        </div>
      )}
    </>
  )
}
