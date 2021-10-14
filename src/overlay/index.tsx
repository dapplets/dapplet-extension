import * as React from 'react';
import * as ReactDOM from 'react-dom';
import '../common/semantic-ui-css/semantic.min.css';
import './index.scss';
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { Bus } from '../common/bus';
import { App } from './pages/App';

type SystemOverlayData = {
  activeTab: string;
  payload: any;
};

export const bus = new Bus();

bus.subscribe('data', (data: SystemOverlayData) => {
    ReactDOM.render(<App activeTab={data.activeTab} data={data.payload} />, document.querySelector('#app'));
});
