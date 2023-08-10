import React, { Key } from 'react'
import Linkify from 'react-linkify'
import { SecureLink } from 'react-secure-link'

export type LinkifyProps = {
  children: string
}

export const LinkifyText: React.FC<LinkifyProps> = ({ children }) => {
  const renderedContent = renderMarkdownWithLinks(children)

  return (
    <Linkify
      componentDecorator={(decoratedHref: string, decoratedText: string, key: Key) => {
        return (
          <SecureLink href={decoratedHref} key={key}>
            {decoratedText}
          </SecureLink>
        )
      }}
    >
      {...renderedContent}
    </Linkify>
  )
}

function renderMarkdownWithLinks(input: string): (string & React.ReactNode)[] {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g

  const parts = []
  let lastIndex = 0
  let match

  while ((match = linkRegex.exec(input)) !== null) {
    const linkText = match[1]
    const linkUrl = match[2]

    parts.push(input.substring(lastIndex, match.index))
    parts.push(<SecureLink href={linkUrl}>{linkText}</SecureLink>)

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < input.length) {
    parts.push(input.substring(lastIndex))
  }

  return parts
}
