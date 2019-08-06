export type DappletConfig = {
    template: string;
    to: string;
    function: string;
    mapping: {
        [parameter: string]: string
    };
    abiInputs: {
        name: string;
        type: string;
    }[];
    signature: string;
}