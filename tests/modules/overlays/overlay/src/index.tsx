import { dappletState } from '@dapplets/dapplet-overlay-bridge'
import React from 'react'
import ReactDOM from 'react-dom'
// LP:  7. Change by adding Share State HOC
import App, { IState } from './App'
import './index.css'

const DappletState = dappletState<IState>(App)

ReactDOM.render(
  <React.StrictMode>
    <DappletState />
  </React.StrictMode>,
  document.getElementById('root')
)
// LP end
