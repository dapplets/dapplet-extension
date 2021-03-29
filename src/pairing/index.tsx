import * as React from 'react';
import * as ReactDOM from 'react-dom';
//import 'semantic-ui-css/semantic.min.css';
import * as logger from '../common/logger';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { App } from './App';
import { Bus } from '../common/bus';

TimeAgo.addDefaultLocale(en);
window.onerror = logger.log;

const bus = new Bus();

bus.subscribe('pair', (chain) => {
    ReactDOM.render(<App bus={bus} chain={chain} />, document.querySelector('#app'));
})