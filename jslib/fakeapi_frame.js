const browser = {};

browser.tabs = {};
browser.runtime = {};

browser.runtime.sendMessage = function (message, callback) {
    //console.log('browser.runtime.sendMessage', arguments);
    sendMessage(message, callback);
}
browser.tabs.sendMessage = function (tabId, message, callback) {
    //console.log('browser.tabs.sendMessage', arguments);
    sendMessage(message, callback);
}

function randomHex(len) {
    return Array.from(crypto.getRandomValues(new Uint8Array(len))).map(x => x.toString(16)).join('');
}

function sendMessage(message, callback) {
    const id = randomHex(8);

    window.top.postMessage(JSON.stringify({
        request: message,
        id: id
    }), '*');

    const handler = (event) => {
        try {
            const payload = JSON.parse(event.data);

            if (payload.id === id && (payload.response !== undefined || payload.request === undefined)) {
                callback !== undefined && callback(payload.response);
                window.removeEventListener('message', handler);
            }
        } catch (err) {}
    }

    window.addEventListener('message', handler);
}


Object.defineProperty(window, 'browser', {
    value: browser
});