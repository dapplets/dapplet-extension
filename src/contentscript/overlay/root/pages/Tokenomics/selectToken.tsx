import cn from 'classnames'
import React, { FC, useState } from 'react'
import { TokenInfo } from './index'
import styles from './selectToken.module.scss'
import LIST_TOKEN from './tokens-list.json'

export interface SelectTokenProps {
  setAnimate: (x) => void
  setSelectToken: (x) => void
  selectToken: TokenInfo
}

export const SelectToken: FC<SelectTokenProps> = (props: SelectTokenProps) => {
  const { setAnimate, setSelectToken, selectToken, ...anotherProps } = props
  const [chooseToken, setChooseToken] = useState('')

  const [isImg, setImg] = useState(false)
  const handleInputChange = (e: any) => {
    const searchToken = LIST_TOKEN.filter((x) => x.address.toLowerCase() === e.toLowerCase())
    setAnimate(true)
    setSelectToken(searchToken[0])
    setTimeout(() => setAnimate(false), 400)
  }

  return (
    <>
      <div className={cn(styles.wrapperSelect)}>
        <div className={styles.inputTitle}>Contract address</div>
        <form
          className={cn(styles.labelInputSearch)}
          onSubmit={(e) => {
            e.preventDefault()
            handleInputChange(chooseToken)
          }}
        >
          <input
            spellCheck="false"
            className={styles.inputSearch}
            type="text"
            value={chooseToken ? chooseToken : ''}
            placeholder="Contract address"
            onChange={(e) => {
              setChooseToken(e.target.value)
            }}
          
          />
        </form>
      </div>
      {selectToken ? (
        <div className={cn(styles.wrapperSelect, styles.tokenInfo)}>
          <div className={styles.blockLeft}>
            {isImg ? (
              <img
                onError={() => setImg(true)}
                src={selectToken.logoURI}
                className={styles.tokenImg}
              ></img>
            ) : (
              <span className={styles.tokenImg}>{selectToken.symbol}</span>
            )}

            <div className={styles.blockLeftInfo}>
              <span className={styles.tokenName}>{selectToken.name}</span>
              <span className={styles.tokenTicker}>{selectToken.symbol}</span>
            </div>
          </div>
          <div className={styles.blockRight}>
            {/* todo: mocked */}
            <div className={styles.blockRightInfo}>
              <span className={cn(styles.infoValue)}>&#36;0.095961</span>
              <span
                className={cn(styles.infoPercent, {
                  [styles.infoPercentHight]: false,
                })}
              >
                5.43&#37;
              </span>
            </div>
            <div className={styles.blockRightInfo}>
              <span className={styles.infoValue}>&#36;13,191,478,444</span>
              <span className={styles.infoName}>market cap</span>
            </div>
            <div className={styles.blockRightInfo}>
              <span className={styles.infoValue}>&#36;937,185,062</span>
              <span className={styles.infoName}>24H trading vol</span>
            </div>
          </div>
        </div>
      ) : selectToken === undefined ? (
        <div style={{ marginTop: '20px' }}>NO AVAILIBLE TOKEN</div>
      ) : null}
    </>
  )
}
