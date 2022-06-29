import cn from 'classnames'
import React, { DetailedHTMLProps, FC, HTMLAttributes, useState } from 'react'
import { IDropdown } from '../../models/dropdown.model'
import styles from './Dropdown.module.scss'

export interface DropdownProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  list: IDropdown[]

  value: {
    label: string
  }
  handlerChangeValue?: (value: IDropdown | null) => void
  setDropdownListValue: any
}

export const Dropdown: FC<DropdownProps> = (props: DropdownProps) => {
  const [isOpen, setOpen] = useState(false)
  const {
    list,
    className,
    value,
    handlerChangeValue,
    title,
    setDropdownListValue,
    ...anotherProps
  } = props

  const onChange = (value: IDropdown) => (): void => handlerChangeValue && handlerChangeValue(value)

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
          {isOpen ? '-' : value.label}
          <span
            className={cn(styles.isOpenIcon, {
              [styles.isOpenAnimationIcon]: isOpen,
            })}
          ></span>
        </span>

        {isOpen && (
          <ul className={styles.list}>
            {list &&
              list.map((item) => {
                const { _id, label } = item
                return (
                  <li
                    className={cn(styles.item)}
                    key={_id}
                    onClick={() => {
                      onChange(item)

                      value.label = item.label
                      setDropdownListValue(item.label)
                    }}
                  >
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
