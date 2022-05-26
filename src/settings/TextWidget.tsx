/**
 * https://github.com/rjsf-team/react-jsonschema-form/blob/3537039e17c76330ec06376c19670c04eafe38db/packages/semantic-ui/src/TextWidget/TextWidget.js
 * https://github.com/rjsf-team/react-jsonschema-form/blob/3537039e17c76330ec06376c19670c04eafe38db/packages/semantic-ui/src/util.js
 */

import { utils } from '@rjsf/core'
import { rangeSpec } from '@rjsf/core/lib/utils'
import React from 'react'
import { Form } from 'semantic-ui-react'
import { getSemanticProps } from './utils'

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
  const semanticProps = getSemanticProps({ formContext, options, uiSchema })
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

  return (
    <Form.Input
      key={id}
      id={id}
      placeholder={placeholder}
      type={schema.type === 'string' ? 'text' : `${schema.type}`}
      label={displayLabel ? label || schema.title : false}
      required={required}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      name={name}
      {...semanticProps}
      value={value || value === 0 ? value : ''}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      step={step}
      {...stepProps}
    />
  )
}
export default TextWidget
