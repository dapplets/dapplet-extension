import * as ethers from "ethers";
import { DappletConfig } from "../types/dappletConfig";

// functions accessible from dapplet context

function sha256(forHash: any | any[]): string {
    let arr = [];
    if (!(forHash instanceof Array)) {
        arr.push(forHash);
    } else {
        arr.push(...forHash);
    }

    return ethers.utils.sha256(
        ethers.utils.arrayify(
            arr.map(e => ethers.utils.sha256(ethers.utils.toUtf8Bytes(e))).join()
        )
    );
}

export function ctxToTxMeta(ctx: any, dappletConfig: DappletConfig): string {
    const dappletFunctions: any = { sha256 };
    const valuesArray = [];

    for (const input of dappletConfig.abiInputs) {
        const mapper = dappletConfig.mapping[input.name]; // example: sha256(text)
        let value = null;

        // ToDo: Fix it
        if (mapper.indexOf('(') !== -1) {
            const functionName = mapper.substr(0, mapper.indexOf('(')); // example: sha256
            const argName = mapper.substr(mapper.indexOf('(') + 1, mapper.indexOf(')') - mapper.indexOf('(') - 1); // example: text
            const argValue = ctx[argName];
            value = dappletFunctions[functionName](argValue);
        } else {
            value = ctx[mapper];
        }

        const hex = ethers.utils.hexlify(ethers.utils.bigNumberify(value));
        valuesArray.push(hex);
    }

    const data = ethers.utils.defaultAbiCoder.encode(dappletConfig.abiInputs, valuesArray);

    return data;
}