import React, { Key } from 'react'
import Linkify from 'react-linkify'
import { SecureLink } from 'react-secure-link'

export type LinkifyProps = {
  children: string
}

export const LinkifyText: React.FC<LinkifyProps> = ({ children }) => (
  <Linkify
    componentDecorator={(decoratedHref: string, decoratedText: string, key: Key) => (
      <SecureLink href={decoratedHref} key={key}>
        {decoratedText}
      </SecureLink>
    )}
  >
    {children}
  </Linkify>
)
