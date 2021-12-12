import * as React from 'react';
import * as ReactDOM from 'react-dom';
import '../common/semantic-ui-css/semantic.min.css';
import './index.scss';
import { Bus } from '../common/bus';
import { App } from './App';
import * as tracing from '../common/tracing';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

TimeAgo.addDefaultLocale(en);
tracing.startTracing();

type SystemOverlayData = {
  activeTab: string;
  payload: any;
};

export const bus = new Bus();

bus.subscribe('data', (data: SystemOverlayData) => {
    ReactDOM.render(<App activeTab={data.activeTab} data={data.payload} />, document.querySelector('#app'));
});
