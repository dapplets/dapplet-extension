import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";
import { NearNetworkConfig } from "../../common/types";
import { BackgroundNear } from "./backgroundNear";
import { BackgroundWalletConnection } from "./backgroundWalletConnection";
import * as NearAPI from "near-api-js";

async function _getCurrentNetworkConfig(networkId: string) {
    const { getNearNetworks } = await initBGFunctions(browser);
    const networkConfigs: NearNetworkConfig[] = await getNearNetworks();
    const currentNetworkConfig = networkConfigs.find(x => x.networkId === networkId);
    if (!currentNetworkConfig) throw new Error(`Cannot find network "near/${networkId}" in the config.`);
    return currentNetworkConfig
}

export async function createWalletConnection(app: string, cfg: { network: string }) {
    const currentNetworkConfig = await _getCurrentNetworkConfig(cfg.network);

    const { localStorage_getItem } = await initBGFunctions(browser);
    const authDataKey = cfg.network + '_wallet_auth_key';
    let authData = JSON.parse(await localStorage_getItem(authDataKey));
    if (!authData) return null;

    const near = new BackgroundNear(app, currentNetworkConfig);
    const wallet = new BackgroundWalletConnection(near, cfg.network, app);
    wallet._authData = authData;
    return wallet.account();
}

export async function createContractWrapper(
    app: string,
    cfg: { network: string },
    address: string,
    options: {
        viewMethods: string[];
        changeMethods: string[];
    }) {
    const currentNetworkConfig = await _getCurrentNetworkConfig(cfg.network);
    const near = new BackgroundNear(app, currentNetworkConfig);
    const wallet = new BackgroundWalletConnection(near, cfg.network, app);
    const account = wallet.account();
    const contract = new NearAPI.Contract(account, address, options);
    return contract;
}