import * as React from 'react';
import * as ReactDOM from 'react-dom';
// import '../common/semantic-ui-css/semantic.min.css';
import 'normalize.css';
import './index.scss';
import { Bus } from '../common/bus';
import { App } from './App';
import * as tracing from '../common/tracing';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { SystemOverlayData } from '../common/types';

TimeAgo.addDefaultLocale(en);
tracing.startTracing();

export const bus = new Bus();

let frames: SystemOverlayData[] = [];

bus.subscribe('data', (frameId: string, frame: SystemOverlayData) => {
    frame.frameId = frameId;
    frames.push(frame);
    ReactDOM.render(<App frames={frames}/>, document.querySelector('#app'));
});

bus.subscribe('close_frame', (frameId: string) => {
    frames = frames.filter(x => x.frameId !== frameId);
    ReactDOM.render(<App frames={frames}/>, document.querySelector('#app'));
    
    if (frames.length === 0) {
        bus.publish('close');
    }
});