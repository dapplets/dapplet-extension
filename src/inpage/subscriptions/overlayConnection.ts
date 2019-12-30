import { Connection } from './connection';
import { OverlayManager } from '../overlayManager';
import { Overlay, SubscribeOptions } from '../overlay';

export type OverlayConnConfig = {
    url: string
    title: string
    tabId?: any
}

export class OverlayConnection extends Connection<OverlayConnConfig> {
    private _overlay: Overlay;

    constructor(cfg: OverlayConnConfig, ovManager: OverlayManager) {
        super(cfg);

        //ToDo: create a tab on 1st message sent
        this._overlay = new Overlay(ovManager, cfg.url, cfg.title);
    }

    public send(msg: any): Promise<void> {
        this.open();
        //ToDo: implement overlay specific
        return new Promise((resolve, reject) => resolve())
    }

    open = (callback?: Function) => (this._overlay.open(callback), this)
    close = () => (this._overlay.close(), this)
    subscribe2 = (topic: string, handler: Function, threading?: SubscribeOptions) => (this._overlay.subscribe(topic, handler, threading), this)
    unsubscribe = (topic: string) => (this._overlay.unsubscribe(topic), this)
    publish = (topic: string, ...args: any) => (this._overlay.publish(topic, ...args), this)

}