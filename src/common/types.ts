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