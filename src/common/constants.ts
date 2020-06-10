export const enum ModuleTypes {
    Feature = "FEATURE",
    Adapter = "ADAPTER",
    Library = "LIBRARY",
    Interface = "INTERFACE"
}

export type WalletInfo = {
    compatible: boolean,
    protocolVersion: string,
    engineVersion: string,
    device: {
        manufacturer: string,
        model: string
    }
}

export const DEFAULT_BRANCH_NAME = "default";

