import React from 'react'
import { CAUserButton } from '../../../../CAUserButton'

const infoLinesToInfoBlocks = (line: string | React.JSX.Element, i: number): React.JSX.Element =>
  typeof line !== 'string' ? (
    line
  ) : !line.includes('<info') ? (
    <p key={(i + 85876) * 5 - 95}>{line}</p>
  ) : (
    (([a, b]) => (
      <CAUserButton
        key={(i + 31) * 1060}
        user={{
          img: '',
          name: b,
          origin: a,
          accountActive: false,
        }}
        info={true}
      />
    ))(
      line
        .split(/<\/?info/g)[1]
        .trim()
        .split('>')
    )
  )

export default infoLinesToInfoBlocks
