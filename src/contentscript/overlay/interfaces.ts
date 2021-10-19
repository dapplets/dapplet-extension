import { IPubSub } from "../types";

export interface IOverlay extends IPubSub {
    uri: string;
    title: string;
    registered: boolean;
    send(topic: string, args: any[]): void;
    onclose: Function;
    onregisteredchange: (value: boolean) => void;
    onMessage(handler: (topic: string, message: any) => void): { off: () => void; };
    open(callback?: Function): void;
    close(): void;
}

export interface IOverlayManager {
    openPopup(path: string): void;
    unregisterAll(): void;
    close(): void;
    getOverlays(): IOverlay[];
    toggle(): void;
    createOverlay(url: string, title: string, hidden?: boolean): IOverlay;
    destroy(): void;
}