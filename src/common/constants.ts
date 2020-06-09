export const enum ModuleTypes {
    Other = "OTHER",
    Feature = "FEATURE",
    Adapter = "ADAPTER",
    Resolver = "RESOLVER",
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

