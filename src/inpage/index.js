import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";
import { initBGFunctions } from "chrome-extension-message-wrapper";

/**
* Widget Injector
*/
const WidgetInjector = {

    _widgets: [],

    pushTransaction: async function (dappletId, metadata) {
        var backgroundFunctions = await initBGFunctions(chrome);
        const { loadDapplet, generateUri, checkConnection, waitPairing } = backgroundFunctions;

        var connected = await checkConnection();

        console.log('connected', connected);

        if (!connected) {
            var uri = await generateUri();
            console.log('uri', uri);
            WalletConnectQRCodeModal.open(uri);
            var result = await waitPairing();
            console.log('result', result);
            WalletConnectQRCodeModal.close();

            if (!result) {
                alert('Wallet paring failed');
                return;
            }
        }

        var dappletResult = await loadDapplet(dappletId, metadata);
        console.log('dappletResult', dappletResult);
        return dappletResult;
    },

    init: async function () {
        var me = this;

        const widgetListUrl = 'https://skillunion.github.io/dapplet-static/domains/' + window.location.hostname + '.json';
        const widgetListResponse = await fetch(widgetListUrl)

        if (!widgetListResponse.ok) {
            console.warn('Widget Injector: Widget list loading error');
            return;
        }

        const widgetListParsed = await widgetListResponse.json()

        if (widgetListParsed == null || widgetListParsed.widgets == null || widgetListParsed.widgets.length == 0) {
            console.warn('Widget Injector: Available widgets not found');
            return;
        }

        for (var i = 0; i < widgetListParsed.widgets.length; i++) {
            var widgetInfo = widgetListParsed.widgets[i];
            if (!widgetInfo.url) return;

            const widgetResponse = await fetch(widgetInfo.url);
            const widgetText = await widgetResponse.text();
            // TODO: Check hash
            const widget = eval(widgetText);
            me._widgets.push(widget);
        }

        if (me._widgets.length == 0) {
            console.warn('Widget Injector: Available widgets not found');
            return;
        }

        console.log('Widget Injector: %s widget(s) was loaded', me._widgets.length);

        for (var i = 0; i < me._widgets.length; i++) {
            try {
                me._widgets[i].init(document, me.pushTransaction);
            } catch (e) {
                console.log('Widget Injector: Widget loading error', e);
            }
        }
    }
}

WidgetInjector.init();