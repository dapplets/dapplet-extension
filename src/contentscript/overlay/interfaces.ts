import { IPubSub } from "../types";

export interface IOverlay extends IPubSub {
    id: string;
    uri: string;
    title: string;
    registered: boolean;
    parent: IOverlay;
    source: string;
    send(topic: string, args: any[]): void;
    onclose: Function;
    onregisteredchange: (value: boolean) => void;
    onMessage(handler: (topic: string, message: any) => void): { off: () => void; };
    open(callback?: Function): void;
    close(): void;
}

export interface IOverlayManager {
    openPopup(path: string): void;
    unregisterAll(source?: string): void;
    close(): void;
    getOverlays(): IOverlay[];
    toggle(): void;
    createOverlay(url: string, title: string, source?: string, hidden?: boolean, parent?: IOverlay): IOverlay;
    destroy(): void;
}