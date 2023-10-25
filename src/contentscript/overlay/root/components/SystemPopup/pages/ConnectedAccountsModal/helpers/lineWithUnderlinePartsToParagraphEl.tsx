import React from 'react'

const lineWithUnderlinePartsToParagraphEl = (
  line: string | React.JSX.Element,
  i: number
): string | React.JSX.Element => {
  if (typeof line !== 'string') return line
  const lineParts = line.split(/<[/u]*?>/g)
  if (lineParts.length > 1) {
    return (
      <p key={(i + 37) * 70 - 6}>
        {lineParts.map((c, j) => {
          if (j % 2 === 0) {
            return c
          }
          return (
            <span key={i * j * 1000} style={{ textDecoration: 'underline' }}>
              {c}
            </span>
          )
        })}
      </p>
    )
  }
  return lineParts[0]
}

export default lineWithUnderlinePartsToParagraphEl
