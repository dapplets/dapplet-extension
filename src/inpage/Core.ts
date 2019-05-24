import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";
import { initBGFunctions } from "chrome-extension-message-wrapper";

export default class Core {
  // ToDo: implement 
  openOverlay(id, ctx) {
    console.log("openOverlay core", { id, ctx });
  }

  // ToDo: implement
  async sendWalletConnectTx(dappletId, metadata): Promise<any> {
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
}