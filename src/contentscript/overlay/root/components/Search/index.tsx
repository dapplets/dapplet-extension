import cn from 'classnames'
import React, { DetailedHTMLProps, InputHTMLAttributes, ReactElement } from 'react'
import { ReactComponent as MiniIcon } from '../../assets/svg/refresh_search.svg'
import { ReactComponent as SearchIcon } from '../../assets/svg/search_close.svg'
import styles from './Search.module.scss'

export interface SearchProps
  extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  onClearValue?: () => void
  onCloseSearch?: () => void
  isOpenSearch: boolean
}

export const Search = (props: SearchProps): ReactElement => {
  const { value, onChange, className, onClearValue, onCloseSearch, isOpenSearch, ...otherProps } =
    props

  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={styles.searchIcon}>
        <SearchIcon onClick={() => onCloseSearch()} />
      </div>
      <label className={styles.labelSearchModule}>
        <input
          spellCheck={false}
          autoFocus
          type="text"
          className={styles.input}
          value={value}
          onChange={onChange}
          {...otherProps}
        />
        <span>
          <MiniIcon
            className={styles.close}
            onClick={() => {
              onClearValue()
            }}
          />
        </span>
      </label>
    </div>
  )
}
