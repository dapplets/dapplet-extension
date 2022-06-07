import { utils } from '@rjsf/core'
import _ from 'lodash'
import React from 'react'
import { Form } from 'semantic-ui-react'
import { getSemanticProps } from '../utils'
import './select.css'
import styles from './SelectWiget.module.scss'

const { asNumber, guessType } = utils

const nums = new Set(['number', 'integer'])

const MyCustomWidget = (props, _onChange, _onBlur, value) => {
  // const{defaultSchemaProps}=props

  return (
    <div>
      <span>{value}</span>
      {props.map((item, index) => (
        <input onClick={_onChange} value={item.value} className="custom" key={index} />
      ))}
    </div>
  )
}

/**
 * * Returns and creates an array format required for semantic drop down
 * @param {array} enumOptions - array of items for the dropdown
 * @param {array} enumDisabled - array of enum option values to disable
 * @returns {*}
 */

function createDefaultValueOptionsForDropDown(enumOptions, enumDisabled) {
  const disabledOptions = enumDisabled || []
  let options = []
  // eslint-disable-next-line no-shadow

  options = _.map(enumOptions, ({ label, value }) => ({
    disabled: disabledOptions.indexOf(value) !== -1,
    key: label,
    text: label,

    value,
  }))
  // <Dropdown.Item style={{ backgroundColor: 'red', color: '#fff' }}>{label}</Dropdown.Item>
  return options
}

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
const processValue = (schema, value) => {
  // "enum" is a reserved word, so only "type" and "items" can be destructured

  const { type, items } = schema
  if (value === '') {
    return undefined
  } else if (type === 'array' && items && nums.has(items.type)) {
    return value.map(asNumber)
  } else if (type === 'boolean') {
    return value === 'true' || value === true
  } else if (type === 'number') {
    return asNumber(value)
  }

  // If type is undefined, but an enum is present, try and infer the type from
  // the enum values
  if (schema.enum) {
    if (schema.enum.every((x) => guessType(x) === 'number')) {
      return asNumber(value)
    } else if (schema.enum.every((x) => guessType(x) === 'boolean')) {
      return value === 'true'
    }
  }

  return value
}

function SelectWidget(props) {
  const {
    schema,
    uiSchema,
    formContext,
    id,
    options,
    name,
    label,
    required,
    disabled,
    readonly,
    value,
    multiple,
    placeholder,
    autofocus,
    onChange,
    onBlur,
    onFocus,
  } = props
  const semanticProps = getSemanticProps({
    schema,
    uiSchema,
    formContext,
    options,
    defaultSchemaProps: {
      inverted: 'false',
      selection: true,
      fluid: true,
      scrolling: true,
      upward: false,
      'aria-expanded': false,
    },
  })
  const { enumDisabled, enumOptions } = options
  const emptyValue = multiple ? [] : ''

  const _onChange = (
    event,
    // eslint-disable-next-line no-shadow
    { value }
  ) => {
    onChange && onChange(processValue(schema, value))
    _onBlur
  }
  // eslint-disable-next-line no-shadow
  const _onBlur = ({ target: { value } }) => onBlur && onBlur(id, processValue(schema, value))
  const _onFocus = ({
    // eslint-disable-next-line no-shadow
    target: { value },
  }) => onFocus && onFocus(id, processValue(schema, value))
  // console.log(semanticProps, '...semanticProps')

  const dropdownOptions = createDefaultValueOptionsForDropDown(enumOptions, enumDisabled)

  console.log(dropdownOptions)
  return (
    <Form.Dropdown
      className={styles.inputSelect}
      key={id}
      name={name}
      // label={label || schema.title}
      multiple={typeof multiple === 'undefined' ? false : multiple}
      value={typeof value === 'undefined' ? emptyValue : value}
      disabled={disabled}
      placeholder={placeholder}
      {...semanticProps}
      required={required}
      autoFocus={autofocus}
      readOnly={readonly}
      options={dropdownOptions}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      onClick={(e) => {
        e.currentTarget.classList.toggle('new_icon')
        e.currentTarget.parentElement.classList.add('khgfjh')
      }}
    />

    // MyCustomWidget(dropdownOptions, _onChange, _onBlur, value)
  )
}
export default SelectWidget
