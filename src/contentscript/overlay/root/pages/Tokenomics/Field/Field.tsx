import cn from 'classnames'
import { Field as FormikField, FieldValidator } from 'formik'
import React from 'react'
import styles from './Field.module.scss'

type Props = {
  label?: string
  name: string
  maxLength?: number
  minLength?: number
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  validate?: FieldValidator
  value?: string
}

const Field = ({
  label,
  name,
  maxLength: max,
  minLength: min,
  disabled,
  invalid,
  required,
  validate,
  value,
}: Props) => {
  return (
    <div className={cn(styles.root, { [styles.divName]: label === 'Token Name' })}>
      <label aria-autocomplete="none" className={styles.label} htmlFor={name}>
        {label}
      </label>
      <FormikField
        validate={validate}
        className={cn(styles.field, { [styles.disabled]: disabled, [styles.error]: invalid })}
        name={name}
        maxLength={max}
        minLength={min}
        disabled={disabled}
        required={required}
        value={value}
      />
    </div>
  )
}

export default Field
