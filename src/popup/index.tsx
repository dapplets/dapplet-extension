import * as React from 'react';
import * as ReactDOM from 'react-dom';
import '../common/semantic-ui-css/semantic.min.css';
import { getCurrentContextIds } from './helpers';
import Popup from './pages/popup';
import * as tracing from '../common/tracing';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { Bus } from '../common/bus';

const bus = new Bus();

TimeAgo.addDefaultLocale(en);

tracing.startTracing();

ReactDOM.render(<Popup bus={bus} contextIds={getCurrentContextIds()} />, document.querySelector('#app'));