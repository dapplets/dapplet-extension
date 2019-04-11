import React from 'react';
import ReactDOM from 'react-dom';
import Index from './pages/index'
import store from "./store.js";
import Helpers from "../utils/helpers";

async function startApp(tabs) {
    var currentTab = tabs[0]; // there will be only one in this array

    // init state
    store.currentHostname = Helpers.getHostName(currentTab.url);

    ReactDOM.render(<Index />, document.querySelector('#app'));
}

chrome.tabs.query({
    active: true,
    currentWindow: true
}, startApp);