export class Overlay {

    private _callbacks: Function[] = [];
    public isOpened: boolean = false;
    private _frame: HTMLIFrameElement = null;
    private _panel: HTMLDivElement = null;


    constructor(url: string) {

        let panel = document.createElement("div");
        panel.classList.add('overlay-frame', 'overlay-outer', 'overlay-collapsed');

        let bucketBar = document.createElement("div");
        bucketBar.classList.add('overlay-bucket-bar');

        let toolBar = document.createElement("div");
        toolBar.classList.add('overlay-toolbar');

        let ul = document.createElement('ul');

        let li = document.createElement('li');

        let button = document.createElement('button');
        button.title = "Toggle or Resize Sidebar";
        button.classList.add('overlay-frame-button', 'overlay-frame-button--sidebar_toggle');
        button.innerText = '⇄';
        button.onclick = () => this.toggle();

        let frame = document.createElement("iframe");
        frame.classList.add('h-sidebar-iframe');
        frame.src = url;
        frame.allowFullscreen = true;
        //frame.id = 'the_iframe';

        li.appendChild(button);
        ul.appendChild(li);
        toolBar.appendChild(ul);
        panel.appendChild(bucketBar);
        panel.appendChild(toolBar);
        panel.appendChild(frame);

        document.body.appendChild(panel);

        window.addEventListener('message', (e) => {
            let callbacks = this._callbacks;

            if (callbacks) {
                for (let callback of callbacks) {
                    callback.call({}, e.data);
                }
            }

        }, false);

        this._panel = panel;
        this._frame = frame;
    }

    public subscribe(handler: (message: any) => void) {
        this._callbacks.push(handler);
    }


    public publish(msg: string) {
        this._frame.contentWindow.postMessage(msg, '*');
    }

    public open() {
        this._panel.classList.remove('overlay-collapsed');
        this.isOpened = true;
    }

    public close() {
        this._panel.classList.add('overlay-collapsed');
        this.isOpened = false;     
    }

    public toggle() {
        if (this.isOpened) {
            this.close();
        } else {
            this.open();
        }
    }
}