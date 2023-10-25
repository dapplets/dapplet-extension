import cn from 'classnames'
import React, { DetailedHTMLProps, InputHTMLAttributes, ReactElement } from 'react'
import { ReactComponent as SearchIcon } from '../../assets/newIcon/search.svg'
import { ReactComponent as MiniIcon } from '../../assets/svg/refresh_search.svg'
import styles from './Search.module.scss'

export interface SearchProps
  extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  onClearValue?: () => void
  onCloseSearch?: () => void
  isOpenSearch: boolean
  className?: string
  handleSearchChange?: any
}

export const Search = (props: SearchProps): ReactElement => {
  const {
    value,
    onChange,
    className,
    onClearValue,
    onCloseSearch,
    isOpenSearch,
    handleSearchChange,
    ...otherProps
  } = props
  console.log(isOpenSearch)

  return (
    <div className={cn(styles.wrapper, className)}>
      <div
        className={cn(
          styles.searchIcon
          //   , {
          //   [styles.searchIconActive]: isOpenSearch,
          // }
        )}
        onClick={() => handleSearchChange()}
      >
        <SearchIcon />
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
