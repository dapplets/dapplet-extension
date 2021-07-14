import * as React from 'react';
import * as ReactDOM from 'react-dom';
import '../common/semantic-ui-css/semantic.min.css';
import * as tracing from '../common/tracing';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { App } from './App';
import { Bus } from '../common/bus';

TimeAgo.addDefaultLocale(en);
tracing.startTracing();

const bus = new Bus();

bus.subscribe('pair', (chain) => {
    ReactDOM.render(<App bus={bus} chain={chain} />, document.querySelector('#app'));
})