import * as ethers from "ethers";

function viewPlainMustache(template: string, data: any) {
    for (const key in data) {
        if (key) {
            const value = data[key];
            template = template.replace('{{' + key + '}}', value);
        }
    }
    return template;
}

function viewHtmlMustache(template: string, data: any) {
    return viewPlainMustache(template, data);
}

export function getRenderer(type: string) {
    switch (type) {
        case "view-plain-mustache":
            return viewPlainMustache;
        case "view-html-mustache":
            return viewHtmlMustache;
        default:
            return null;
    }
}

function builderTxSolidity(tx: any, data: any) {
    const values = [];

    for (const arg of tx.args) {
        const prop = arg.split(":")[0];
        let value = data[prop];

        const chain = arg.split(":").splice(1);

        for (const fnName of chain) {
            if (fnName === "bigNumberify" && typeof value === "number") {
                value = value.toString();
            }
            value = ethers.utils[fnName](value);
        }

        const hex = ethers.utils.hexlify(value);

        values.push(hex);
    }

    const fnSignature = ethers.utils.hexDataSlice(ethers.utils.id(tx.function), 0, 4);
    const types = tx.function.substr(tx.function.indexOf("(")).replace("(", "").replace(")", "").split(","); // ToDo: use utils?
    const valuesData = ethers.utils.defaultAbiCoder.encode(types, values);

    return {
        to: tx.to,
        data: fnSignature + valuesData.substring(2),
        value: tx.value || "0x"
    };
}

export function getTxBuilder(type: string) {
    switch (type) {
        case "builder-tx-sol":
            return builderTxSolidity;
        default:
            return null;
    }
}