import { Bus } from "./bus";

class StarterBus extends Bus {
    _subId: number = 0;

    onCtx(callback: (ctx: any, buttons: any[]) => void) {
        this.subscribe('ctx', (ctx: any, buttons: any[]) => {
            callback(ctx, buttons);
            return (++this._subId).toString();
        });
    }

    emitButtonClicked(id: string): void {
        this.publish(this._subId.toString(), {
            type: 'button_clicked',
            message: id
        });
    }
}

const busInstance = new StarterBus();

export {
    busInstance,
    StarterBus
};