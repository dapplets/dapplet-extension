import React, {
  FC,
  FunctionComponent,
  ReactNode,
  HTMLAttributes,
  DetailedHTMLProps,
  useEffect,
} from 'react'
import cn from 'classnames'
import styles from './Dropdown.module.scss'
import { IDropdown } from '../../models/dropdown.model'
import { useToggle } from '../../hooks/useToggle'

export interface DropdownProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  list: IDropdown[]
  // value?: IDropdown | null
  value: {
    label: string
  }
  handlerChangeValue?: (value: IDropdown | null) => void
  setDropdownListValue?: (x) => void
}

export const Dropdown: FC<DropdownProps> = (props: DropdownProps) => {
  const [isOpen, setOpen] = useToggle(false)
  const {
    list,
    className,
    value,
    handlerChangeValue,
    title,
    setDropdownListValue,
    ...anotherProps
  } = props
  // useEffect(() => {}, [])

  const onChange = (value: IDropdown) => (): void =>
    handlerChangeValue && handlerChangeValue(value)

  return (
    <div
      className={cn({ [styles.isTitle]: title })}
      {...anotherProps}
      onClick={setOpen}
    >
      {title && <p className={styles.title}>{title}</p>}

      <div className={cn(styles.dropdownBlock, { [styles.isOpen]: isOpen })}>
        <span className={cn(styles.spanBlock, className)} {...props}>
          {/* {value.label ? value.label : 'All'} */}
          {value.label}
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
