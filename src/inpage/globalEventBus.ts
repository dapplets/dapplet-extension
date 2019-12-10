import * as extension from 'extensionizer';

export function publish(topic: string, data: any) {
    extension.runtime.sendMessage({ type: "EVENTBUS_PUBLISH", payload: { topic, data } });
}

export function subscribe(topic: string, func: Function) {
    extension.runtime.onMessage.addListener(({ topic, data }) => func(topic, data));
    extension.runtime.sendMessage({ type: "EVENTBUS_SUBSCRIBE", payload: { topic } });
}