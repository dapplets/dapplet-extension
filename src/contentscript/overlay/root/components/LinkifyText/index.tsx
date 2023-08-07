import React, { Key, useState } from 'react'
import Linkify from 'react-linkify'
import { SecureLink } from 'react-secure-link'

export type LinkifyProps = {
  children: string
}

export const LinkifyText: React.FC<LinkifyProps> = ({ children }) => {
  const reg = /\[[^\[\]]*?\]\(.*?\)|^\[*?\]\(.*?\)/gim

  const [matchesLinks, setMatchesLink] = useState(children ? children.match(reg) : null)

  const replacedSymbols = (targetText: string) => {
    const newDecoratedText =
      matchesLinks &&
      matchesLinks.length &&
      matchesLinks
        .filter((x) => x.match(targetText))[0]
        .replace(/\[|\]/g, '')
        .replace(/\(.+\)/, '')
    return newDecoratedText
  }
  return (
    <Linkify
      componentDecorator={(decoratedHref: string, decoratedText: string, key: Key) => {
        return (
          <SecureLink title={decoratedHref} href={decoratedHref} key={key}>
            {replacedSymbols(decoratedHref) ? replacedSymbols(decoratedHref) : 'link'}
          </SecureLink>
        )
      }}
    >
      {children ? children.replace(/\[.+\]/, '').replace(/\(|\)/g, '') : children}
    </Linkify>
  )
}
