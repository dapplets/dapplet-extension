import React from 'react'

const emptyLinesToParagraphEl = (line: string, i: number): string | React.JSX.Element =>
  line === '' || line === ' ' ? <p key={(i + 31) * 7 - 9}> </p> : line

export default emptyLinesToParagraphEl
