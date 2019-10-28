export class Swiper {

    private _touchStartX = 0;
    private _touchStartY = 0;
    private _touchEndX = 0;
    private _touchEndY = 0;
    private _callbacks: {
        [event: string]: Function[]
    } = {};

    private _config = {
        angleWidth: 0.75,
        lengthPart: 0.05,
        touches: 1
    };

    constructor(el: HTMLElement) {
        console.log("swiper init");
        el.addEventListener('touchstart', (event) => {
            if (event.changedTouches.length != this._config.touches) return;
            this._touchStartX = event.changedTouches[0].screenX;
            this._touchStartY = event.changedTouches[0].screenY;
        }, false);

        el.addEventListener('touchend', (event) => {
            if (event.changedTouches.length != this._config.touches) return;
            this._touchEndX = event.changedTouches[0].screenX;
            this._touchEndY = event.changedTouches[0].screenY;
            this._touchHandler();
        }, false);
    }

    private _touchHandler() {
        const dX = this._touchEndX - this._touchStartX;
        const dY = this._touchEndY - this._touchStartY;

        const width = document.body.offsetWidth
        const height = document.body.offsetHeight

        const angle = -Math.atan2(dY, dX) * 180 / Math.PI;

        const { angleWidth, lengthPart } = this._config;

        if (-45 * angleWidth < angle && angle < 45 * angleWidth && Math.abs(dX) / width > lengthPart) {
            this._fireEvent("right");
        }

        if (90 - 45 * angleWidth < angle && angle < 90 + 45 * angleWidth && Math.abs(dY) / height > lengthPart) {
            this._fireEvent("up");
        }

        if ((180 - 45 * angleWidth < angle && angle < 180 || -180 < angle && angle < -180 + 45 * angleWidth) && Math.abs(dX) / width > lengthPart) {
            this._fireEvent("left");
        }

        if (-90 - 45 * angleWidth < angle && angle < -90 + 45 * angleWidth && Math.abs(dY) / height > lengthPart) {
            this._fireEvent("down");
        }
    }

    private _fireEvent(event: string) {
        for (const callback of this._callbacks[event] || []) {
            callback.apply({});
        }
    }

    public on(event: "left" | "right" | "down" | "up", callback: () => void) {
        if (!this._callbacks[event]) {
            this._callbacks[event] = [];
        }
        this._callbacks[event].push(callback);
    }
}