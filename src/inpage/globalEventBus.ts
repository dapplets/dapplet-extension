export function publish(topic: string, data: any) {
    chrome.runtime.sendMessage({ type: "EVENTBUS_PUBLISH", payload: { topic, data } });
}

export function subscribe(topic: string, func: Function) {
    chrome.runtime.onMessage.addListener(({ topic, data }) => func(topic, data));
    chrome.runtime.sendMessage({ type: "EVENTBUS_SUBSCRIBE", payload: { topic } });
}