import * as React from 'react';
import * as ReactDOM from 'react-dom';
//import 'semantic-ui-css/semantic.min.css'
import './index.scss';
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { HashRouter, Route, Link, Redirect, Switch } from "react-router-dom";
import { browser } from "webextension-polyfill-ts";
import * as logger from '../common/logger';
import { Bus } from '../common/bus';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { App } from './pages/App';

TimeAgo.addDefaultLocale(en);
window.onerror = logger.log;

const bus = new Bus();

bus.subscribe('login', (app, account) => {
    console.log(`Login request from ${app}`);
    ReactDOM.render(<App bus={bus} account={account} app={app} />, document.querySelector('#app'));
})
