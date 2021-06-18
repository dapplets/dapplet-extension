export type DefaultConfig = {
    [Environments.Dev]?: {
        [key: string]: any
    },
    [Environments.Test]?: {
        [key: string]: any
    },
    [Environments.Main]?: {
        [key: string]: any
    }
}

export type SchemaConfig = any;

export enum Environments {
    Dev = "dev",
    Test = "test",
    Main = "main"
}

export enum DefaultSigners {
    EXTENSION = 'extension'
}

export enum ChainTypes {
    ETHEREUM = 'ethereum',
    NEAR = 'near'
}

export enum WalletTypes {
    WALLETCONNECT = 'walletconnect',
    METAMASK = 'metamask',
    NEAR = 'near'
}

export type WalletDescriptor = {
    chain: string;
    type: string;
    meta: {
        icon: string;
        name: string;
        description: string;
    } | null;
    connected: boolean;
    available: boolean;
    account: string;
    chainId: number;
    apps: string[];
    default: boolean;
    lastUsage: string;
}

export type ModuleId = {
    name: string, 
    branch: string, 
    version: string
}