import React from 'react'
import { Accordion, Icon, Ref } from 'semantic-ui-react'

interface IWidgetProps {
  index: string
  name: string
  text: string
  activeIndexes: string[]
  handleClick: any
  refs: any
}

export default (props: IWidgetProps) => {
  const { index, name, text, activeIndexes, handleClick, refs } = props
  return (
    <Ref innerRef={refs[index]}>
      <>
        <Accordion.Title active={activeIndexes.includes(index)} index={index} onClick={handleClick}>
          <Icon name="dropdown" />
          {name}
        </Accordion.Title>
        <Accordion.Content active={activeIndexes.includes(index)}>
          <p>{text}</p>
        </Accordion.Content>
      </>
    </Ref>
  )
}
