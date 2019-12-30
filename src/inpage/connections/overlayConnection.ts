import { Connection } from './connection';

export type OverlayConnConfig = {
    url: string
    title: string
    tabId?: any
}

export class OverlayConnection extends Connection<OverlayConnConfig>{
    public send(msg: any): Promise<void> {
        //ToDo: implement overlay specific
        return new Promise((resolve, reject) => resolve())
    }
}