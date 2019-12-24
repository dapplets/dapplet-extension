import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Popup from './pages/popup'
import store from "./store";
import 'semantic-ui-css/semantic.min.css';
import * as extension from 'extensionizer';

async function startApp([currentTab]) {
    // init state
    const contextIds: string[] = await new Promise((res) => extension.tabs.sendMessage(currentTab.id, { "type": "CURRENT_CONTEXT_IDS" }, res));
    store.currentContextIds = contextIds;

    setTimeout(() => store.currentContextIds = [], 5000);

    ReactDOM.render(<Popup />, document.querySelector('#app'));
}

extension.tabs.query({
    active: true,
    currentWindow: true
}, startApp);