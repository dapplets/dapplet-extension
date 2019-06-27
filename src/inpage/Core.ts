import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { Connection } from './Connection';

export default class Core {

    private _isOverlayAttached: boolean = false;

    // ToDo: implement 
    public openOverlay(url: string, messageHandler?: Function) {
        this._isOverlayAttached = true;

        let panel = document.createElement("div");
        panel.classList.add('overlay-frame', 'overlay-outer');

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
        button.onclick = function () {
            if (panel.classList.contains('overlay-collapsed')) {
                panel.classList.remove('overlay-collapsed');
            } else {
                panel.classList.add('overlay-collapsed');
            }
        }

        let frame = document.createElement("iframe");
        frame.classList.add('h-sidebar-iframe');
        frame.src = url;
        frame.allowFullscreen = true;
        frame.id = 'the_iframe';

        li.appendChild(button);
        ul.appendChild(li);
        toolBar.appendChild(ul);
        panel.appendChild(bucketBar);
        panel.appendChild(toolBar);
        panel.appendChild(frame);

        document.body.appendChild(panel);

        if (messageHandler) {
            window.addEventListener('message', function (e) {
                messageHandler(e.data);
            }, false);
        }
    }

    public sendMessageToOverlay(msg: string) {
        const frame = document.getElementById('the_iframe') as HTMLIFrameElement;
        frame.contentWindow.postMessage(msg, '*');
    }

    // ToDo: implement
    public async sendWalletConnectTx(dappletId, metadata): Promise<any> {
        var backgroundFunctions = await initBGFunctions(chrome);
        const {
            loadDapplet,
            generateUri,
            checkConnection,
            waitPairing,
            transactionCreated,
            transactionRejected
        } = backgroundFunctions;

        var connected = await checkConnection();

        // ToDo: we shouldn't call console.log() directly, because need an opportunity to disable logging (only for dev)
        console.log("connected", connected);

        console.log(0);
        if (!connected) {
            console.log(1);
            var uri = await generateUri();
            console.log(2);
            console.log("uri", uri);
            console.log(3);
            WalletConnectQRCodeModal.open(uri, {});
            console.log(4);
            var result = await waitPairing();
            console.log(5);
            console.log("result", result);
            console.log(6);
            WalletConnectQRCodeModal.close();
            console.log(7);

            if (!result) {
                alert("Wallet paring failed");
                return;
            }
        }
        console.log(8);

        const dappletResult = await loadDapplet(dappletId, metadata);
        console.log(9);
        console.log("dappletResult", dappletResult);

        if (dappletResult) {
            transactionCreated(dappletResult);
        } else {
            transactionRejected();
        }

        return dappletResult;
    }

    public connect(url: string) : Connection {
        return new Connection(url);
    }
}