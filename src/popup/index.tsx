import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Bus } from '../common/bus'
import '../common/semantic-ui-css/semantic.min.css'
import * as tracing from '../common/tracing'
import Popup from './pages/popup'

const bus = new Bus()

TimeAgo.addDefaultLocale(en)
tracing.startTracing()

ReactDOM.render(<Popup bus={bus} />, document.querySelector('#app'))
