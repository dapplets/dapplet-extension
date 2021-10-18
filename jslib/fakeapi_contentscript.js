import common_script from '!raw-loader!../build/common.js'
import popup_script from '!raw-loader!../build/popup.js'
import deploy_script from '!raw-loader!../build/deploy.js'
import pairing_script from '!raw-loader!../build/pairing.js'
import sowa_script from '!raw-loader!../build/sowa.js'
import starter_script from '!raw-loader!../build/starter.js'
import settings_script from '!raw-loader!../build/settings.js'
import login_script from '!raw-loader!../build/login.js'
import guide_script from '!raw-loader!../build/guide.js'
import overlay_script from '!raw-loader!../build/overlay.js'

import fakeapi_frame_script from '!raw-loader!./fakeapi_frame.js'

const browser = {};

browser.browserAction = {};
browser.browserAction.onClicked = {};
browser.commands = {};
browser.commands.onCommand = {};
browser.contextMenus = {};
browser.runtime = {};
browser.notifications = {};
browser.notifications.onClicked = {};
browser.runtime = {};
browser.runtime.onMessage = {};
browser.runtime.onConnect = {};
browser.storage = {};
browser.storage.local = {};
browser.tabs = {};
browser.tabs.onActivated = {};
browser.tabs.onUpdated = {};
browser.runtime.onInstalled = {};

const callbacksMap = new WeakMap();

browser.browserAction.setIcon = async function (details, callback) {
    //console.log('browser.browserAction.setIcon', arguments);
    callback !== undefined && typeof callback === 'function' && callback();
}
browser.browserAction.setBadgeText = async function (details, callback) {
    //console.log('browser.browserAction.setBadgeText', arguments);
    callback !== undefined && typeof callback === 'function' && callback();
}
browser.browserAction.setBadgeBackgroundColor = async function (details, callback) {
    //console.log('browser.browserAction.setBadgeBackgroundColor', arguments);
    callback !== undefined && typeof callback === 'function' && callback();
}
browser.browserAction.setPopup = async function (details, callback) {
    //console.log('browser.browserAction.setBadgeBackgroundColor', arguments);
    callback !== undefined && typeof callback === 'function' && callback();
}
browser.browserAction.onClicked.addListener = function () {
    //console.log('browser.commands.onCommand.addListener', arguments);
}
browser.commands.onCommand.addListener = function () {
    //console.log('browser.commands.onCommand.addListener', arguments);
}
browser.contextMenus.create = async function (createProperties, callback) {
    //console.log('browser.contextMenus.create', arguments);
    callback !== undefined && typeof callback === 'function' && callback();
}
browser.contextMenus.removeAll = async function (callback) {
    //console.log('browser.contextMenus.removeAll', arguments);
    callback !== undefined && typeof callback === 'function' && callback();
}

const _blobUriCache = {};

browser.runtime.getURL = function (url) {
    //console.log('browser.runtime.getURL', arguments);

    if (_blobUriCache[url] !== undefined) return _blobUriCache[url];

    let script = null;

    if (url === 'popup.html') {
        script = popup_script;
    } else if (url === 'deploy.html') {
        script = deploy_script;
    } else if (url === 'pairing.html') {
        script = pairing_script;
    } else if (url === 'sowa.html') {
        script = sowa_script;
    } else if (url === 'starter.html') {
        script = starter_script;
    } else if (url === 'settings.html') {
        script = settings_script;
    } else if (url === 'login.html') {
        script = login_script;
    } else if (url === 'guide.html') {
        script = guide_script;
    } else if (url === 'overlay.html') {
        script = overlay_script;
    }

    if (script === null) return;

    const blob = new Blob([`<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css">
        </head>
        <body>
          <div id="app"></div>
          <script>` + fakeapi_frame_script + `</script>
          <script>
            window.browser.tabs.query = async function (query, callback) {
                //console.log('browser.tabs.query2', arguments);
                const result = [{
                    id: '1',
                    url: '${window.location.href}',
                    pendingUrl: '${window.location.href}'
                }];
                callback !== undefined && typeof callback === 'function' && callback(result);
                return Promise.resolve(result);
            }
          </script>
          <script>` + common_script + `</script>
          <script>` + script + `</script>
        </body>
        </html>`], {
        type: 'text/html'
    });

    const uri = window.URL.createObjectURL(blob);
    _blobUriCache[url] = uri;
    return uri;
}

browser.notifications.create = async function (notificationId, options, callback) {
    //console.log('browser.notifications.create', arguments);
    callback !== undefined && typeof callback === 'function' && callback();
}
browser.notifications.onClicked.addListener = function () {
    //console.log('browser.notifications.onClicked.addListener', arguments);
}

browser.runtime.onMessage.addListener = function (callback) {
    //console.log('browser.runtime.onMessage.addListener', arguments);
    const callbackWrapper = async e => {
        try {
            const payload = (typeof e.data === 'string') ? JSON.parse(e.data) : (typeof e.data.message === 'string') ? JSON.parse(e.data.message): null;
            if (payload && payload.request !== undefined) {
                if (callback !== undefined && typeof callback === 'function') {
                    const response = await Promise.resolve(callback(payload.request, {
                        tab: {
                            id: '1',
                            url: window.location.href,
                            pendingUrl: window.location.href
                        }
                    }));

                    if (response === undefined) return;

                    const frames = window.document.querySelector('dapplets-overlay-manager')?.shadowRoot?.querySelectorAll('iframe') ?? [];
                    for (const frame of frames) {
                        frame.contentWindow.postMessage(JSON.stringify({
                            id: payload.id,
                            response
                        }), '*');
                    }

                    window.postMessage(JSON.stringify({
                        id: payload.id,
                        response
                    }), '*');
                }
            }
        } catch (err) { }
    };
    callbacksMap.set(callback, callbackWrapper)
    window.addEventListener('message', callbackWrapper);
}

browser.runtime.onMessage.removeListener = function (callback) {
    const callbackWrapper = callbacksMap.get(callback);
    window.removeEventListener('message', callbackWrapper);
}

browser.runtime.onConnect.addListener = function (callback) {
    //console.log('browser.runtime.onConnect.addListener', arguments);
}

browser.runtime.sendMessage = async function (message, callback) {
    //console.log('browser.runtime.sendMessage', arguments);
    return sendMessage(message, callback);
}
browser.storage.local.get = async function (key, callback) {
    //console.log('browser.storage.local.get', arguments);
    const _storage = JSON.parse(localStorage.getItem('dapplet-extension') || "{}");

    let result = {};
    if (!key) {
        result = _storage;
    } else if (Array.isArray(key)) {
        key.map(akey => {
            if (typeof _storage[akey] !== 'undefined') {
                result[akey] = _storage[akey];
            }
        });
    } else if (typeof key === 'object') {
        // TODO support nested objects
        Object.keys(key).map(oKey => {
            if (typeof _storage[oKey] !== 'undefined') {
                result[oKey] = _storage[oKey];
            } else {
                result[oKey] = key[oKey];
            }
        });
    } else {
        result[key] = _storage[key];
    }
    //console.log('result storage', result);
    callback !== undefined && typeof callback === 'function' && callback(result);
    return result;
}
browser.storage.local.remove = async function (key, callback) {
    //console.log('browser.storage.local.remove', arguments);
    const _storage = JSON.parse(localStorage.getItem('dapplet-extension') || "{}");
    if (Array.isArray(key)) {
        key.map(aKey => {
            delete _storage[aKey];
        });
    } else {
        delete _storage[key];
    }

    localStorage.setItem('dapplet-extension', JSON.stringify(_storage));

    callback !== undefined && typeof callback === 'function' && callback();
}
browser.storage.local.set = async function (key, value, callback) {
    //console.log('browser.storage.local.set', arguments);
    const _storage = JSON.parse(localStorage.getItem('dapplet-extension') || "{}");
    if (typeof key === 'object') {
        // TODO support nested objects
        Object.keys(key).map(oKey => {
            _storage[oKey] = key[oKey];
        });
        localStorage.setItem('dapplet-extension', JSON.stringify(_storage));
    } else {
        _storage[key] = value;
        localStorage.setItem('dapplet-extension', JSON.stringify(_storage));
    }
    callback !== undefined && typeof callback === 'function' && callback();
}
browser.tabs.create = async function (createProperties, callback) {
    //console.log('browser.tabs.create', arguments);
    callback !== undefined && typeof callback === 'function' && callback();
}
browser.tabs.onActivated.addListener = function () {
    //console.log('browser.tabs.onActivated.addListener', arguments);
}
browser.tabs.onUpdated.addListener = function () {
    //console.log('browser.tabs.onUpdated.addListener', arguments);
}
browser.tabs.query = async function (query, callback) {
    //console.log('browser.tabs.query', arguments);
    const result = [{
        id: '1',
        url: window.location.href,
        pendingUrl: window.location.href
    }];
    callback !== undefined && typeof callback === 'function' && callback(result);
    return Promise.resolve(result);
}
browser.tabs.sendMessage = async function (tabId, message, callback) {
    //console.log('browser.tabs.sendMessage', arguments);
    return sendMessage(message, callback);
}
browser.runtime.onInstalled.addListener = function () { }
browser.tabs.executeScript = async function () { }
browser.runtime.connect = () => ({ onDisconnect: { addListener: () => { } } })

function randomHex(len) {
    return Array.from(crypto.getRandomValues(new Uint8Array(len))).map(x => x.toString(16)).join('');
}

async function sendMessage(message, callback) {
    return new Promise((res, rej) => {
        const id = randomHex(8);

        const handler = (event) => {
            try {
                const payload = typeof event.data === 'string' ? 
                    JSON.parse(event.data) : (typeof event.data.message === 'string') ? 
                        JSON.parse(event.data.message) : null;

                if (!!payload && payload.id === id && (payload.response !== undefined || payload.request === undefined)) {
                    window.removeEventListener('message', handler);
                    callback !== undefined && typeof callback === 'function' && callback(payload.response);
                    res(payload.response);
                }
            } catch (err) { }
        }

        window.addEventListener('message', handler);

        window.top.postMessage(JSON.stringify({
            request: message,
            id: id
        }), '*');
    });
}


Object.defineProperty(window, 'browser', { value: browser });
Object.defineProperty(window, 'DAPPLETS_JSLIB', { value: true });

eval(common_script);