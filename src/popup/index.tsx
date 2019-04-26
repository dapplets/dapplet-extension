import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Popup from './pages/Popup'
import store from "./store.js";
import Helpers from "../utils/helpers";
import 'semantic-ui-css/semantic.min.css'

async function startApp(tabs) {
    var currentTab = tabs[0]; // there will be only one in this array

    // init state
    store.currentHostname = Helpers.getHostName(currentTab.url);

    ReactDOM.render(<Popup />, document.querySelector('#app'));
}

chrome.tabs.query({
    active: true,
    currentWindow: true
}, startApp);