import { IDappStateProps } from '@dapplets/dapplet-overlay-bridge'
import React from 'react'

export interface IState {
  counter: any
  text: string
}

export default class App extends React.Component<IDappStateProps<IState>> {
  render() {
    const { sharedState, changeSharedState, id } = this.props
    return (
      <>
        {id ? (
          <>
            <p>Counter: {sharedState[id]?.counter ?? 0}</p>
            <input
              value={sharedState[id].text}
              onChange={(e) => changeSharedState?.({ text: e.target.value }, id)}
            />
            <p></p>
            <button
              className="ch-state-btn"
              onClick={() => changeSharedState?.({ counter: sharedState[id].counter + 1 }, id)}
            >
              Counter +1
            </button>
          </>
        ) : (
          Object.entries(sharedState).map(([id, value]: [string, any]) => (
            <p key={id}>
              <b>{id}:</b> {value?.counter} / {value?.text}{' '}
            </p>
          ))
        )}
      </>
    )
  }
}
