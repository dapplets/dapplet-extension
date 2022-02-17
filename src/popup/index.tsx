import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import '../common/semantic-ui-css/semantic.min.css';
import Popup from './pages/popup';
import * as tracing from '../common/tracing';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { Bus } from '../common/bus';
import { GlobalEventBus } from "../common/globalEventBus";

const bus = new Bus();

TimeAgo.addDefaultLocale(en);
tracing.startTracing();

const contextIdsPromise = initBGFunctions(browser).then(x => x.getCurrentContextIds());

const globalEventBus = new GlobalEventBus();

ReactDOM.render(<Popup bus={bus} contextIds={contextIdsPromise} />, document.querySelector('#app'));