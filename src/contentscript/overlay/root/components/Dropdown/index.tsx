import cn from 'classnames'
import React, { DetailedHTMLProps, FC, HTMLAttributes, useState } from 'react'
import { ReactComponent as DropdownIcon } from '../../assets/icons/iconDropdown.svg'
import { IDropdown } from '../../models/dropdown.model'
import styles from './Dropdown.module.scss'

export type DropdownProps = Omit<
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
  'onChange'
> & {
  list: IDropdown[]
  value: string
  onChange: (value: string) => void
}

export const Dropdown: FC<DropdownProps> = (props: DropdownProps) => {
  const [isOpen, setOpen] = useState(false)
  const { list, className, value, title, onChange, ...anotherProps } = props

  const currentLabel = list.find((x) => x.value === value)?.label ?? value

  return (
    <div
      className={cn({ [styles.isTitle]: title })}
      {...anotherProps}
      onClick={() => setOpen(!isOpen)}
    >
      {title && <p className={styles.title}>{title}</p>}

      <div
        tabIndex={0}
        onBlur={() => {
          setOpen(false)
        }}
        className={cn(styles.dropdownBlock, { [styles.isOpen]: isOpen })}
      >
        <span className={cn(styles.spanBlock, className)} {...anotherProps}>
          {isOpen ? '\u2013' : currentLabel}
          <span
            className={cn(styles.isOpenIcon, {
              [styles.isOpenAnimationIcon]: isOpen,
            })}
          >
            <DropdownIcon />
          </span>
        </span>

        {isOpen && (
          <ul className={styles.list}>
            {list &&
              list.map((item) => {
                const { _id, label } = item
                return (
                  <li className={cn(styles.item)} key={_id} onClick={() => onChange(item.value)}>
                    {label}
                  </li>
                )
              })}
          </ul>
        )}
      </div>
    </div>
  )
}
