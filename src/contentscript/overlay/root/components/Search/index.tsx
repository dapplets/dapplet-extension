import React, {
  DetailedHTMLProps,
  InputHTMLAttributes,
  ReactElement,
} from 'react'
import styles from './Search.module.scss'
import cn from 'classnames'
import { ReactComponent as MiniIcon } from '../../assets/icons/mini-close.svg'
import { ReactComponent as SearchIcon } from '../../assets/svg/magnifying-glass.svg'

export interface SearchProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  onClearValue?: () => void
  onCloseSearch?: () => void
}

export const Search = (props: SearchProps): ReactElement => {
  const {
    value,
    onChange,
    className,
    onClearValue,
    onCloseSearch,
    ...otherProps
  } = props

  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={styles.searchIcon}>
        <SearchIcon onClick={onCloseSearch} />
      </div>
      <label className={styles.label}>
        <input
          type="text"
          className={styles.input}
          value={value}
          onChange={onChange}
          {...otherProps}
        />
      </label>
      <MiniIcon className={styles.close} onClick={onClearValue} />
    </div>
  )
}
