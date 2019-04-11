import React from 'react';
import ReactDOM from 'react-dom';
import Index from './pages/index'
import store from "./store.js";

async function startApp(tabs) {
    var currentTab = tabs[0]; // there will be only one in this array

    function getHostName(url) {
        var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
        if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
        return match[2];
        }
        else {
            return null;
        }
    }

    // init state
    store.currentHostname = getHostName(currentTab.url);

    ReactDOM.render(<Index />, document.querySelector('#app'));
}

chrome.tabs.query({
    active: true,
    currentWindow: true
}, startApp);