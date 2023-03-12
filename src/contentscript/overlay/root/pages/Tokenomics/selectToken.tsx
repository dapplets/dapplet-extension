import cn from 'classnames'
import React, { FC, useState } from 'react'
import { regExpIndexEthereum } from '../../common/constants'
import { getValidationAddress } from '../../common/helpers'
import { TokenInfo } from './index'
import styles from './selectToken.module.scss'

export interface SelectTokenProps {
  setAnimate: (x) => void
  setSelectToken: (x) => void
  selectToken: TokenInfo
  chooseToken: string
  setChooseToken: (x) => void
  daiInfo: any
}

export const SelectToken: FC<SelectTokenProps> = (props: SelectTokenProps) => {
  const {
    setAnimate,
    setSelectToken,
    chooseToken,
    selectToken,
    setChooseToken,
    daiInfo,
    ...anotherProps
  } = props

  const [isImg, setImg] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    const newValue = e.target.value

    setChooseToken('')
    setChooseToken(newValue)
    onChange(newValue)

    setAnimate(true)

    setSelectToken(daiInfo)

    setTimeout(() => setAnimate(false), 400)
  }
  const onChange = (value: string) => {
    if (getValidationAddress(value, regExpIndexEthereum) !== null) {
      return daiInfo
    } else return undefined
  }

  return (
    <>
      <div className={cn(styles.wrapperSelect)}>
        <div className={styles.inputTitle}>Contract address</div>
        <form className={cn(styles.labelInputSearch)}>
          <input
            spellCheck="false"
            className={styles.inputSearch}
            type="text"
            value={chooseToken ? chooseToken : ''}
            placeholder="Contract address"
            onChange={handleInputChange}
          />
        </form>
      </div>
      {daiInfo ? (
        <div className={cn(styles.wrapperSelect, styles.tokenInfo)}>
          <div className={styles.blockLeft}>
            {isImg ? (
              <img
                onError={() => setImg(true)}
                // src={daiInfo.logoURI}
                className={styles.tokenImg}
              ></img>
            ) : (
              <span className={styles.tokenImg}>{daiInfo.symbol}</span>
            )}

            <div className={styles.blockLeftInfo}>
              <span className={styles.tokenName}>{daiInfo.name}</span>
              <span className={styles.tokenTicker}>{daiInfo.symbol}</span>
            </div>
          </div>
          <div className={styles.blockRight}>
            {/* todo: mocked */}
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
          </div>
        </div>
      ) : selectToken === undefined ? (
        <div style={{ marginTop: '20px' }}>Token not found</div>
      ) : null}
    </>
  )
}
