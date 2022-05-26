import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Bus } from '../common/bus'
import '../common/semantic-ui-css/semantic.min.css'
import * as tracing from '../common/tracing'
import './index.scss'
import { App } from './pages/App'

TimeAgo.addDefaultLocale(en)
tracing.startTracing()

const bus = new Bus()

bus.subscribe('login', (app, chain, account) => {
  console.log(`Login request from ${app}`)
  ReactDOM.render(
    <App bus={bus} account={account} chain={chain} app={app} />,
    document.querySelector('#app')
  )
})
