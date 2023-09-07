import cn from 'classnames'
import React, { FC, useEffect } from 'react'
import { Burger } from '../Burger'
import { Dropdown } from '../Dropdown'
import styles from './MultitablePanel.module.scss'

export const MultitablePanel: FC = () => {
  useEffect(() => {
    console.log(window.innerWidth)
  }, [window.innerWidth])

  return (
    <div
      style={{
        width: `${window.innerWidth}px`,
        right: `${
          !document
            .querySelector('#dapplets-overlay-manager')
            ?.classList.contains('dapplets-overlay-collapsed')
            ? 0
            : 468
        }px`,
      }}
      className={cn(styles.layout)}
    >
      <div className={cn(styles.wrapper)}>
        <Burger />
        <Dropdown />
      </div>
    </div>
  )
}
