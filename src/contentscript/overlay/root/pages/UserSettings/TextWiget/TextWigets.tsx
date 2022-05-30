import { utils } from '@rjsf/core'
import { rangeSpec } from '@rjsf/core/lib/utils'
// import { Form } from 'semantic-ui-react'
// import {Form} from './index'
import cn from 'classnames'
import React from 'react'
import { getSemanticProps } from '../utils'
// import './textWiget.css'
import styles from './TextWiget.module.scss'
// const Form = JSONSchemaForm.default;

const { getDisplayLabel } = utils
function TextWidget(props) {
  const {
    id,
    placeholder,
    name,
    label,
    value,
    required,
    readonly,
    disabled,
    onChange,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    uiSchema,
    formContext,
  } = props
  const uiThemeProps = getSemanticProps({ formContext, options, uiSchema })
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) => onChange(value === '' ? options.emptyValue : value)
  const _onBlur = () => onBlur && onBlur(id, value)
  const _onFocus = () => onFocus && onFocus(id, value)
  const displayLabel = getDisplayLabel(
    schema,
    uiSchema
    /* TODO: , rootSchema */
  )

  const step = schema.type === 'number' ? 'any' : undefined // non-integer numbers shouldn't have a default step of 1
  const stepProps = rangeSpec(schema) // sets step, min, and max from the schema
  console.log('lala')

  return (
    <div className={cn({ [styles.inputBlock]: `${schema.type}` === 'number' })}>
      {`${schema.type}` === 'number' ? (
        <button type="button" className={styles.buttonMin}></button>
      ) : null}
      <input
        className={cn(styles.inputOverlay, {
          [styles.inputOverlayNumber]: `${schema.type}` === 'number',
        })}
        key={id}
        id={id}
        placeholder={placeholder}
        type={schema.type === 'string' ? 'text' : `${schema.type}`}
        label={displayLabel ? label || schema.title : false}
        required={required}
        autoFocus={autofocus}
        disabled={disabled || readonly}
        name={name}
        {...uiThemeProps}
        value={value || value === 0 ? value : ''}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        step={step}
        {...stepProps}
      />
      {`${schema.type}` === 'number' ? (
        <button type="button" className={styles.buttonMax}></button>
      ) : null}
    </div>
  )
}
export default TextWidget
